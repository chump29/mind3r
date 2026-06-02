#!.venv/bin/python

"""Environment setup"""

from datetime import UTC, datetime, timedelta
from typing import TYPE_CHECKING

from api import Reminder, ReminderDTO, add_reminder, delete_reminder  # pylint: disable=import-error

if TYPE_CHECKING:
    from behave.model import Feature
    from behave.runner import Context
else:
    Feature = object
    Context = object


def before_feature(context: Context, feature: Feature) -> None:
    """Run before features"""
    if "crud" not in feature.tags:
        return
    for reminder in Reminder.select().where(Reminder.event == "TESTME").iterator():  # * NOTE: Clean up old data
        delete_reminder(reminder.id)
    context.reminder = add_reminder(
        ReminderDTO(date=datetime.now(tz=UTC) + timedelta(minutes=5), event="TESTME", description="TESTME")
    )
    assert context.reminder, "Could not add reminder data"


def after_feature(context: Context, feature: Feature) -> None:
    """Run after features"""
    if "crud" not in feature.tags or not context.reminder:
        return
    assert delete_reminder(context.reminder.id), "Could not delete reminder data"
