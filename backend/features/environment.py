#!.venv/bin/python

"""Environment setup"""

from datetime import UTC
from pathlib import Path
from typing import TYPE_CHECKING, Final

# pylint: disable-next=import-error
from api import DB_PATH, MAX_LEN_EVENT, Reminder, ReminderDTO, add_reminder
from faker import Faker

if TYPE_CHECKING:
    from behave.model import Feature
    from behave.runner import Context
else:
    Context = object
    Feature = object

fake: Final[Faker] = Faker()


def truncate_string(event: str) -> str:
    """Truncate event title, if needed"""
    if len(event) > MAX_LEN_EVENT:
        return f"{event[:MAX_LEN_EVENT - 1]}…"
    return event


def generate_event() -> str:
    """Generate fake event title"""
    return truncate_string(" ".join(fake.words(unique=True)).title())


def generate_description() -> str:
    """Generate fake event description"""
    return truncate_string(fake.sentence())


def get_new_reminder() -> ReminderDTO:
    """Return new ReminderDTO"""
    return ReminderDTO(
        id=None, date=fake.future_datetime(tzinfo=UTC), event=generate_event(), description=generate_description()
    )


def before_feature(context: Context, _: Feature) -> None:
    """Run before features"""
    Reminder.delete().execute(None)
    context.user = fake.first_name()
    assert context.user, "Could not set user"
    context.reminder = add_reminder(reminder=get_new_reminder(), user=context.user)
    assert context.reminder, "Could not add reminder"


def after_feature(_: Context, __: Feature) -> None:
    """Run after features"""
    for filename in Path(DB_PATH).glob("mind3r.test.*"):
        Path(filename).unlink()
