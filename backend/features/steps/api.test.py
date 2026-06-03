#!.venv/bin/python

# pylint: disable=not-callable

"""CRUD tests"""

from datetime import UTC, datetime
from pathlib import Path
from tomllib import load
from typing import TYPE_CHECKING, Final

from api import (  # pylint: disable=import-error
    PORT,
    ReminderDTO,
    add_reminder,
    delete_reminder,
    get_all_reminders,
    get_cache_stats,
    get_one_reminder,
    get_version,
    update_reminder,
)
from behave import given, then, when
from box import Box

if TYPE_CHECKING:
    from behave.runner import Context
    from cachetools import _CacheInfo
else:
    Context = object
    _CacheInfo = object


@given("that a user wants a reminder by ID")
def get_reminder_by_id(_: Context) -> None:
    """Get reminder by ID"""


@when("/get API endpoint is called with an ID")
def call_get_one_reminder(context: Context) -> None:
    """Call /get API with ID"""
    context.reminder = get_one_reminder(context.reminder.id)
    assert not context.failed, "/get with ID call failed"


@then("reminder data is returned")
def return_data(context: Context) -> None:
    """Return reminder data"""
    assert context.reminder, "Invalid results"
    assert context.reminder.id == 1, "Incorrect results"


@given("that a user wants to update a reminder")
def update_reminder_by_id(_: Context) -> None:
    """Update reminder by ID"""


@when("/update API endpoint is called with an ID")
def call_update_reminder(context: Context) -> None:
    """Call /update API with ID"""
    context.reminder.description = "TESTME2"
    context.reminder = update_reminder(pk=context.reminder.id, reminder=context.reminder)
    assert not context.failed, "/update with ID call failed"


@then("reminder data is updated")
def return_updated_data(context: Context) -> None:
    """Return updated reminder data"""
    assert context.reminder, "Invalid results"
    assert context.reminder.description == "TESTME2", "Could not update reminder description"


@given("that a user wants all reminders")
def get_reminders(_: Context) -> None:
    """Get all reminders"""


@when("/get API endpoint is called")
def call_get(context: Context) -> None:
    """Call /get API"""
    context.reminders = get_all_reminders()
    assert not context.failed, "/get call failed"


@then("all reminders are returned")
def return_all_reminders(context: Context) -> None:
    """Return all reminders"""
    assert context.reminders, "Invalid results"
    assert len(context.reminders) == 1, "Incorrect results"


@given("that a user wants cache stats")
def get_cache(_: Context) -> None:
    """Get cache stats"""


@when("/stats API endpoint is called")
def call_stats(context: Context) -> None:
    """Call /stats API"""
    context.stats = get_cache_stats()
    assert not context.failed, "/stats call failed"


@then("cache stats are returned")
def return_cache_stats(context: Context) -> None:
    """Return cache stats"""
    assert context.stats, "Invalid results"


@given("a request for the version")
def request_version(context: Context) -> None:
    """Request version"""
    with Path("pyproject.toml").open("rb") as pyproject:
        context.real_version = str(Box(load(pyproject), frozen_box=True).project.version)


@when("/version API endpoint is called")
def call_get_version(context: Context) -> None:
    """Call /version API"""
    context.version = get_version()
    assert not context.failed, "/version call failed"


@then("port {port} is used")
def verify_port(_: Context, port: str) -> None:
    """Verify port"""
    assert int(port.replace('"', "")) == PORT, f"Invalid port: {port}"


@then("version is returned")
def version_returned(context: Context) -> None:
    """Return version"""
    assert context.real_version == context.version, "Invalid results"


@then("version is cached")
def verify_cache(_: Context) -> None:
    """Verify cache"""
    get_version()
    cache: Final[_CacheInfo] = get_version.cache_info()
    assert cache.hits == 1, "Version not cached (hits)"
    assert cache.misses == 1, "Version not cached (misses)"


@given("bad requests")
def bad_requests(_: Context) -> None:
    """Bad requests"""


@when("provided bad input")
def bad_input(context: Context) -> None:
    """Bad input"""
    bad_reminder: Final[ReminderDTO] = ReminderDTO(date=datetime.now(tz=UTC), event="")
    context.bad_add = add_reminder(bad_reminder)
    context.bad_update = update_reminder(1, bad_reminder)
    context.bad_delete = delete_reminder(10)
    assert not context.failed, "Bad API calls failed"


@then("/add should fail")
def add_fail(context: Context) -> None:
    """/add should fail"""
    assert context.bad_add is None, "/add should fail"


@then("/update should fail")
def update_fail(context: Context) -> None:
    """/update should fail"""
    assert context.bad_update is None, "/update should fail"


@then("/delete should fail")
def delete_fail(context: Context) -> None:
    """/delete should fail"""
    assert not context.bad_delete, "/delete should fail"


@given("that a ReminderDTO should stringify")
def stringify_reminder_dto(_: Context) -> None:
    """Stringify a ReminderDTO"""


@when("a ReminderDTO is output")
def output_reminder_dto(context: Context) -> None:
    """Output a ReminderDTO"""
    context.reminder_dto = str(ReminderDTO(date=datetime.now(tz=UTC), event="REMINDER_DTO"))
    assert not context.failed, "Unable to stringify ReminderDTO"


@then("ReminderDTO should be a string")
def reminder_dto_string(context: Context) -> None:
    """ReminderDTO should be a string"""
    assert context.reminder_dto, "Invalid ReminderDTO string"
    assert isinstance(context.reminder_dto, str), "Invalid ReminderDTO type"
