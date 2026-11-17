#!/usr/bin/env bash
# Copy this build's image from ECR to an Azure registry (AIT-38 0.7, as in
# backend-rush-connect's scripts/azure/mirror-image.sh; AIT-38 D-9:
# build once, push to every provider's registry, each cluster pulls from its
# own). `crane copy` keeps the digest, so AKS runs byte-for-byte what EKS runs.
#
# Usage: scripts/azure/mirror-image.sh <acr login server> <tag> [repository]
#   e.g. scripts/azure/mirror-image.sh rushowl.azurecr.io v1.2.3
# The repository (same name in ECR and ACR) defaults to $CIRCLE_PROJECT_REPONAME.
#
# Runs in a job pod of the in-cluster CircleCI runner on AKS: the pod signs in
# to the registry as the deploy identity through workload identity (the
# runner's resource class labels its pods azure.workload.identity/use, and its
# service account carries the identity's client id; rushowl-infra
# kubernetes/<cluster>/circleci-runner). It reads ECR with the AWS keys
# from the CircleCI context (AWS_ACCOUNT_ID, AWS_REGION, AWS_ACCESS_KEY,
# AWS_SECRET_ACCESS_KEY).
set -euo pipefail

acr="${1:?usage: $0 <acr login server> <tag> [repository]}"
tag="${2:?usage: $0 <acr login server> <tag> [repository]}"
repo="${3:-${CIRCLE_PROJECT_REPONAME:?no repository given and CIRCLE_PROJECT_REPONAME unset}}"
: "${AWS_ACCOUNT_ID:?}" "${AWS_REGION:?}"
: "${AZURE_FEDERATED_TOKEN_FILE:?no workload identity in this pod (resource class label azure.workload.identity/use and the client-id annotation on the service account)}"
export AWS_ACCESS_KEY_ID="${AWS_ACCESS_KEY_ID:-${AWS_ACCESS_KEY:?}}"

# crane and the ECR credential helper, pinned and checksum-verified (same
# versions as rushos-backend scripts/azure/install-ci-tools.sh).
CRANE_VERSION=v0.22.1
CRANE_SHA256=0ab7a1d6932a213aed964ce97666c3077fe691c8606413674a8b3e0b9ec4cda0
ECR_HELPER_VERSION=0.12.0
ECR_HELPER_SHA256=a22ab6d59dbac777b8fb31984709461da00a4c778b6ae14c8d3729e8d5ded1a6

bin="$HOME/bin"
mkdir -p "$bin" "$HOME/.docker"
export PATH="$bin:$PATH"
tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT

curl -fsSL -o "$tmp/crane.tgz" \
  "https://github.com/google/go-containerregistry/releases/download/$CRANE_VERSION/go-containerregistry_Linux_x86_64.tar.gz"
echo "$CRANE_SHA256  $tmp/crane.tgz" | sha256sum -c -
tar -xzf "$tmp/crane.tgz" -C "$bin" crane
curl -fsSL -o "$bin/docker-credential-ecr-login" \
  "https://amazon-ecr-credential-helper-releases.s3.us-east-2.amazonaws.com/$ECR_HELPER_VERSION/linux-amd64/docker-credential-ecr-login"
echo "$ECR_HELPER_SHA256  $bin/docker-credential-ecr-login" | sha256sum -c -
chmod +x "$bin/docker-credential-ecr-login"

ecr="$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com"
printf '{"credHelpers":{"%s":"ecr-login"}}\n' "$ecr" >"$HOME/.docker/config.json"

# Workload identity token -> Entra access token -> ACR refresh token.
aad="$(curl -fsS -X POST "${AZURE_AUTHORITY_HOST%/}/$AZURE_TENANT_ID/oauth2/v2.0/token" \
  -d client_id="$AZURE_CLIENT_ID" -d grant_type=client_credentials \
  -d scope=https://management.azure.com/.default \
  -d client_assertion_type=urn:ietf:params:oauth:client-assertion-type:jwt-bearer \
  --data-urlencode client_assertion@"$AZURE_FEDERATED_TOKEN_FILE" | jq -er .access_token)"
refresh="$(curl -fsS -X POST "https://$acr/oauth2/exchange" \
  -d grant_type=access_token -d service="$acr" -d tenant="$AZURE_TENANT_ID" \
  --data-urlencode access_token="$aad" | jq -er .refresh_token)"
printf '%s' "$refresh" | crane auth login "$acr" -u 00000000-0000-0000-0000-000000000000 --password-stdin

src="$ecr/$repo:$tag"
dst="$acr/$repo:$tag"
echo "=== $src -> $dst"
crane copy "$src" "$dst"
want="$(crane digest "$src")"
got="$(crane digest "$dst")"
[ "$want" = "$got" ] || { echo "digest mismatch: ECR $want, ACR $got" >&2; exit 1; }
echo "ok: $dst ($got)"
