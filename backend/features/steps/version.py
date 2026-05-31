#!.venv/bin/python

# pylint: disable=missing-function-docstring, not-callable
# ruff: noqa: D103

"""Version tests"""

from pathlib import Path
from tomllib import load
from typing import TYPE_CHECKING, Final

from api import PORT, get_version
from behave import given, then, when
from box import Box

if TYPE_CHECKING:
    from behave.runner import Context
    from cachetools import _CacheInfo
else:
    Context = object
    _CacheInfo = object


@given("a request for the API version")
def request_version(context: Context) -> None:
    with Path("pyproject.toml").open("rb") as pyproject:
        context.real_version = str(Box(load(pyproject), frozen_box=True).project.version)


@when("/version API endpoint is called")
def endpoint_called(context: Context) -> None:
    context.version = get_version()
    assert context.failed is not True, "/version call failed"


@then("port {port} is used")
def port_used(_: Context, port: str) -> None:
    assert int(port.replace('"', "")) == PORT, f"Invalid port: {port}"


@then("version is returned")
def version_returned(context: Context) -> None:
    assert context.real_version == context.version, "Invalid version"


@then("version is cached")
def version_cached(_: Context) -> None:
    get_version()
    cache: Final[_CacheInfo] = get_version.cache_info()
    assert cache.hits == 1, "Version not cached (hits)"
    assert cache.misses == 1, "Version not cached (misses)"
