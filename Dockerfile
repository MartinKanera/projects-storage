FROM node:12

WORKDIR /usr/src/app

ENV HOST 0.0.0.0
ENV PORT 8080

ARG FIREBASE_CONFIG
ENV FIREBASE_CONFIG=${FIREBASE_CONFIG}

ARG SERVICE_ACCOUNT
ENV SERVICE_ACCOUNT=${SERVICE_ACCOUNT}

ARG TENANT
ENV TENANT=${TENANT}

ARG BROWSER_BASE_URL
ENV BROWSER_BASE_URL=${BROWSER_BASE_URL}

COPY . .

RUN yarn install --pure-lockfile --non-interactive

RUN yarn build

ENV NODE_ENV production

RUN yarn install --pure-lockfile --non-interactive --production

CMD yarn start
