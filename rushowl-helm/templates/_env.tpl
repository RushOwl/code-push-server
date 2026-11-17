{{- /*
The container's env list with .Values.extraEnv laid over it: extraEnv is a
name -> value map; an entry whose name is already in the list replaces that
entry (value or valueFrom) in place, the rest are appended in key order. An
AKS overlay uses it to swap the ElastiCache secretKeyRefs for the in-cluster
Redis without copying the whole env list. Empty (the values.yaml default):
exactly the list, so EKS and Brunei render unchanged.
Called with (dict "env" <the container's env list> "extra" .Values.extraEnv).
*/}}
{{- define "codepush.env" -}}
{{- $extra := .extra | default dict -}}
{{- $env := list -}}
{{- $seen := dict -}}
{{- range (.env | default list) -}}
{{- if hasKey $extra .name -}}
{{- $env = append $env (dict "name" .name "value" (toString (get $extra .name))) -}}
{{- $_ := set $seen .name true -}}
{{- else -}}
{{- $env = append $env . -}}
{{- end -}}
{{- end -}}
{{- range $k, $v := $extra -}}
{{- if not (hasKey $seen $k) -}}
{{- $env = append $env (dict "name" $k "value" (toString $v)) -}}
{{- end -}}
{{- end -}}
{{- toYaml $env -}}
{{- end -}}
