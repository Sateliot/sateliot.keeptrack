FROM node:22.13.1-alpine3.21 AS build_node

WORKDIR /app/

COPY . /app/

RUN npm ci \
    && npm run build


FROM caddy:alpine

WORKDIR /app

COPY --from=build_node /app/dist /usr/share/caddy

COPY ./configs/caddy/Caddyfile /etc/caddy/Caddyfile

CMD ["caddy", "run", "--config", "/etc/caddy/Caddyfile"]
