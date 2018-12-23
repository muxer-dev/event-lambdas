FROM node:8.10-alpine

ENV NPM_CONFIG_LOGLEVEL warn

WORKDIR /usr/src/event-lambdas
COPY package.json package-lock.json ./

RUN npm install

COPY . .

RUN npm run install-lambda-dependencies
