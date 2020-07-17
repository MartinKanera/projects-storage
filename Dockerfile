FROM node:12

WORKDIR /usr/src/app

ENV HOST 0.0.0.0
ENV PORT 8080

COPY . .

RUN yarn install --pure-lockfile --non-interactive

RUN yarn build

ENV NODE_ENV production

RUN yarn install --pure-lockfile --non-interactive --production

CMD yarn start
