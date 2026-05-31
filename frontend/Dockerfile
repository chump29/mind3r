#!/usr/bin/env -S docker build . --tag=mind3r-frontend --file
# docker build --no-cache --progress=plain . --tag=mind3r-frontend --file

FROM oven/bun:alpine AS build

WORKDIR /app

COPY . .

RUN --mount=type=cache,target=/.bun-cache \
    bun install --frozen-lockfile --ignore-scripts && \
    bun run build

# -=-

FROM nginx:alpine

LABEL org.opencontainers.image.authors="Chris Post <admin@postfmly.com>" \
    org.opencontainers.image.description="Reminders (Frontend)" \
    org.opencontainers.image.licenses="GPL-3.0-only" \
    org.opencontainers.image.title="Mind3r (Frontend)" \
    org.opencontainers.image.url="https://github.com/chump29/mind3r"

# hadolint ignore=DL3018
RUN apk add --no-cache tzdata && \
    rm -rf /usr/share/nginx/html/*

WORKDIR /usr/share/nginx/html

COPY --from=build /app/dist .

COPY nginx.conf /etc/nginx/conf.d/default.conf

ENV TZ=Etc/GMT

HEALTHCHECK --interval=60s CMD source /usr/share/nginx/html/healthcheck.sh

EXPOSE 80

ENTRYPOINT ["nginx", "-g", "daemon off;"]
