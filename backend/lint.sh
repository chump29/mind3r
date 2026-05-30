#!/usr/bin/env -S bash -e

uv run pylint --verbose .

uv run pre-commit run --all-files
