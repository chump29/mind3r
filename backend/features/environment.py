#!.venv/bin/python

"""Environment setup"""

from datetime import UTC, datetime, timedelta
from typing import TYPE_CHECKING, Final

from api import (  # pylint: disable=import-error
    Reminder,
    ReminderDTO,
    add_reminder,
    delete_reminder,
)

if TYPE_CHECKING:
    from behave.model import Feature
    from behave.runner import Context
else:
    Context = object
    Feature = object


def before_feature(context: Context, _: Feature) -> None:
    """Run before features"""
    for reminder in Reminder.select().iterator():
        delete_reminder(reminder.id)
    now: Final[datetime] = datetime.now(tz=UTC)
    context.reminder = add_reminder(
        ReminderDTO(date=now + timedelta(minutes=5), event="TESTME", description="TESTME")
    )
    add_reminder(ReminderDTO(date=now - timedelta(minutes=5), event="EXPIRED"))
    assert context.reminder, "Could not add reminder data"


def after_feature(context: Context, _: Feature) -> None:
    """Run after features"""
    assert delete_reminder(context.reminder.id), "Could not delete reminder data"
