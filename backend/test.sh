#!/usr/bin/env -S bash -e

rm -f .coverage* && \
uv run coverage run --module behave --stop && \
echo && \
uv run coverage report && \
uv run coverage json
