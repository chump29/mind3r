#!/usr/bin/env -S docker build . --tag=mind3r-backend --file
# docker build --no-cache --progress=plain . --tag=mind3r-backend --file

ARG PYTHON_VERSION="3.14"

FROM ghcr.io/astral-sh/uv:python${PYTHON_VERSION}-alpine AS build

WORKDIR /backend

ENV UV_LINK_MODE=copy
ENV UV_NO_DEV=1
ENV UV_PYTHON_DOWNLOADS=0

RUN --mount=type=cache,target=/root/.cache/uv \
    --mount=type=bind,source=uv.lock,target=uv.lock \
    --mount=type=bind,source=pyproject.toml,target=pyproject.toml \
    uv sync --frozen --no-install-project

COPY . /backend/

RUN --mount=type=cache,target=/root/.cache/uv \
    uv sync --frozen

RUN rm uv.lock

# -=-

FROM python:${PYTHON_VERSION}-alpine

LABEL org.opencontainers.image.authors="Chris Post <admin@postfmly.com>" \
    org.opencontainers.image.description="Reminders (Backend)" \
    org.opencontainers.image.licenses="GPL-3.0-only" \
    org.opencontainers.image.title="Mind3r (Backend)" \
    org.opencontainers.image.url="https://github.com/chump29/mind3r"

# hadolint ignore=DL3018
RUN apk add --no-cache tzdata

WORKDIR /backend

COPY --from=build /backend .

ENV PATH="/backend/.venv/bin:$PATH"
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV TZ=Etc/GMT

HEALTHCHECK --interval=60s --start-interval=5s CMD source /backend/healthcheck.sh

EXPOSE 5559

CMD ["fastapi", "run", "api.py", "--port", "5559"]
