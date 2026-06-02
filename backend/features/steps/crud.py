#!.venv/bin/python

# pylint: disable=not-callable

"""CRUD tests"""

from typing import TYPE_CHECKING

from api import get_all_reminders, get_one_reminder, update_reminder  # pylint: disable=import-error
from behave import given, then, when

if TYPE_CHECKING:
    from behave.runner import Context
else:
    Context = object


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
