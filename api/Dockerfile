FROM node:18.18.0-alpine3.18

WORKDIR /app

COPY package.json package-lock.json tsconfig.json .
RUN npm install && npm run clean

COPY script /app/script
COPY test /app/test

RUN mkdir tmp
RUN npm run build

CMD [ "npm", "run", "start" ]

