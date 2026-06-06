#!/usr/bin/env -S bash -e

export DB_FILE=mind3r.test.db

rm -f .coverage* && \
uv run coverage run --module behave --stop && \
echo && \
uv run coverage report && \
uv run coverage json
