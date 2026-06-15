#!.venv/bin/python

"""API Service"""

from dataclasses import dataclass
from datetime import UTC, datetime
from hashlib import sha256
from os import getenv, getpid, kill
from pathlib import Path
from signal import SIGINT, SIGKILL, SIGTERM, Signals, signal
from tomllib import load
from typing import TYPE_CHECKING, Final

from box import Box
from cachetools import LRUCache, _CacheInfo, cached
from dotenv import load_dotenv
from fastapi import APIRouter, FastAPI
from nh3 import clean  # pylint: disable=no-name-in-module
from peewee import AutoField, CharField, DateTimeField, Model, SqliteDatabase, TextField
from playhouse.shortcuts import model_to_dict
from pluralizer import Pluralizer
from pydantic import BaseModel, ConfigDict, Field, PositiveInt, StrictStr
from rich.console import Console
from rich.traceback import install as catch_exceptions
from semver import Version
from str2bool3 import str2bool
from uvicorn import run

if TYPE_CHECKING:
    from types import FrameType

    from cachetools import _cached_wrapper_info

load_dotenv()
load_dotenv(".env.local")

DEBUG: Final[bool] = str2bool(getenv("DEBUG")) or False

DB_PATH: Final[str] = "./db/"
DB_FILE: Final[str] = getenv("DB_FILE", "mind3r.db")
DB_STR: Final[str] = f"{DB_PATH}{DB_FILE}"
DB: Final[SqliteDatabase] = SqliteDatabase(DB_STR, pragmas={"journal_mode": "wal", "wal_checkpoint": "TRUNCATE"})

CONSOLE: Final[Console] = Console()
catch_exceptions()


def shutdown(sig: int, _: FrameType | None = None) -> None:
    """Close database"""
    if DEBUG:
        CONSOLE.print(f"\n❌ {Signals(sig).name } detected")
        CONSOLE.print("🛢️  Closing database")
    DB.close()
    if DEBUG:
        CONSOLE.print("🛑 Stopping server")
    kill(getpid(), SIGKILL)


signal(SIGINT, shutdown)
signal(SIGTERM, shutdown)

MAX_LEN_EVENT: Final[int] = 50
MAX_LEN_USER: Final[int] = 64
MAX_LEN_USER_TEXT: Final[int] = 255

pluralizer: Final[Pluralizer] = Pluralizer()


class UserDTO(BaseModel):
    """User domain model"""

    user: StrictStr = Field(max_length=MAX_LEN_USER_TEXT)

    model_config = ConfigDict(extra="forbid")

    def __hash__(self: UserDTO) -> int:
        """Make hashable for caching"""
        return hash(self.user)


class Reminder(Model):
    """Reminder database model"""

    id: AutoField = AutoField()
    date: DateTimeField = DateTimeField()
    event: CharField = CharField(max_length=MAX_LEN_EVENT)
    description: TextField = TextField(null=True)
    user: CharField = CharField(max_length=MAX_LEN_USER)

    @dataclass
    class Meta:
        """Metadata"""

        database: Final[SqliteDatabase] = DB


def shorten(user: str) -> str:
    """Return shortened SHA-256 string"""
    return user[:7]


class ReminderDTO(BaseModel):
    """Reminder domain model"""

    id: PositiveInt | None = Field(strict=True, default=None)
    date: datetime
    event: StrictStr = Field(max_length=MAX_LEN_EVENT)
    description: StrictStr | None = Field(default=None)
    user: StrictStr | None = Field(max_length=MAX_LEN_USER, default=None)

    model_config = ConfigDict(extra="forbid")

    def __str__(self: ReminderDTO) -> str:
        """Show ReminderDTO data"""
        return (
            f"id={self.id}, date={self.date}, event={self.event}, "
            f"description={self.description}, user={shorten(str(self.user))}"
        )

    def sanitize(self: ReminderDTO) -> ReminderDTO:
        """Sanitize ReminderDTO"""
        return setattr(self, "user", None) or self


def log(msg: str, info: str = "") -> None:
    """Log to console"""
    s: Final[str] = f"[bold green]{msg}[/bold green]"
    if not info:
        CONSOLE.log(s)
    else:
        CONSOLE.log(f"{s}: [cyan]{info}[/cyan]")


if not Path(DB_PATH).exists():
    if DEBUG:
        CONSOLE.print("📂 Creating path", DB_PATH)
    Path(DB_PATH).mkdir(parents=True)

if not Path(DB_STR).exists():
    if DEBUG:
        CONSOLE.print("🛢️  Creating database", DB_FILE)
    Reminder.create_table()
elif DEBUG:
    CONSOLE.print("🛢️  Using database", DB_STR)


ROUTER: Final[APIRouter] = APIRouter(prefix="/api")


type Json = int | float | None | dict[str, Json] | list[str] | list[Json]


@ROUTER.get("/cache", response_model=Json | None)
def get_cache_stats() -> Json:
    """Get cache stats"""
    try:

        def get_cached_users() -> list[str]:
            """Get cached users"""
            json: list[str] = []
            if get_all_reminders.cache:
                json.extend(item[0][1][1].user for item in list(get_all_reminders.cache.items()))
            return json

        def create_stats(func: _cached_wrapper_info) -> Json:
            """Create stats"""
            info: Final[_CacheInfo] = func.cache_info()
            return {
                func.__name__: {
                    "Hits": info.hits,
                    "Misses": info.misses,
                    "Maximum Size": info.maxsize,
                    "Current Size": info.currsize,
                    "Cached Users": get_cached_users() if func.__name__ == get_all_reminders.__name__ else None,
                }
            }

        return [create_stats(get_version), create_stats(get_all_reminders)]
    except Exception:  # pylint: disable=broad-exception-caught
        CONSOLE.print_exception()
        return None


def delete_expired(user: str) -> None:
    """Delete expired reminders"""
    try:
        count: Final[int] = (
            Reminder.delete()
            .where(datetime.now(UTC) >= Reminder.date)
            .execute()  # * NOTE: Delete all expired reminders
        )
        if count > 0:
            get_all_reminders.cache_clear()
            if DEBUG:
                log(f"Deleted {pluralizer.pluralize('expired reminder', count, True)} for {shorten(user)}")
    except Exception:  # pylint: disable=broad-exception-caught
        CONSOLE.print_exception()


@ROUTER.get("/version", response_model=str | None)
@cached(cache=LRUCache(maxsize=1), info=True)
def get_version() -> str | None:
    """Get version"""

    def invalid_version(version: str) -> None:
        """Invalid version"""
        msg: Final[str] = f"Invalid version: {version}"
        raise ValueError(msg)

    try:
        with Path("pyproject.toml").open("rb") as pyproject:
            version: Final[str] = str(Box(load(pyproject), frozen_box=True).project.version)
            if not Version.is_valid(version):
                invalid_version(version)
            if DEBUG:
                log("Got version:", version)
            return version
    except Exception:  # pylint: disable=broad-exception-caught
        CONSOLE.print_exception()
        return None


def get_user_hash(user: str) -> str:
    """Get user hash"""
    return sha256(user.encode()).hexdigest()


@ROUTER.post("/get", response_model=list[ReminderDTO] | None)
@cached(cache=LRUCache(maxsize=10), info=True)
def get_all_reminders(user: UserDTO) -> list[ReminderDTO] | None:
    """Get all reminders"""
    if not user or not user.user:
        return None
    try:
        user_hash: Final[str] = get_user_hash(user.user)
        delete_expired(user_hash)
        count: Final[int] = Reminder.select().where(Reminder.user == user_hash).count(None)
        if count == 0:
            return None
        if DEBUG:
            log(f"Getting {pluralizer.pluralize('reminder', count, True)} for {shorten(user_hash)}")
        return [
            ReminderDTO(**model_to_dict(reminder)).sanitize()
            for reminder in Reminder.select().where(Reminder.user == user_hash).order_by(Reminder.date.asc())
        ]
    except Exception:  # pylint: disable=broad-exception-caught
        CONSOLE.print_exception()
        return None


@ROUTER.get("/get/{pk}", response_model=ReminderDTO | None)
def get_one_reminder(pk: int) -> ReminderDTO | None:
    """Get reminder by ID"""
    try:
        if DEBUG:
            log("Getting reminder ID", str(pk))
        return ReminderDTO(**model_to_dict(Reminder.get_or_none(Reminder.id == pk))).sanitize()
    except Exception:  # pylint: disable=broad-exception-caught
        CONSOLE.print_exception()
        return None


def sanitize(reminder: ReminderDTO) -> ReminderDTO | None:
    """Sanitize input"""
    if not reminder.event or not reminder.user:
        return None
    reminder.event = clean(reminder.event, tags=set()).replace("&amp;", "&")
    reminder.description = (
        clean(reminder.description, tags=set()).replace("&amp;", "&") if reminder.description else None
    )
    reminder.user = clean(reminder.user, tags=set()).replace("&amp;", "&")
    return reminder


@ROUTER.post("/add", response_model=ReminderDTO | None)
def add_reminder(reminder: ReminderDTO) -> ReminderDTO | None:
    """Add reminder"""
    r: Final[ReminderDTO | None] = sanitize(reminder)
    if not r:
        return None
    r.user = get_user_hash(str(r.user))
    try:
        if DEBUG:
            log("Adding reminder", str(r))
        get_all_reminders.cache_clear()
        return ReminderDTO(
            **model_to_dict(Reminder.create(date=r.date, event=r.event, description=r.description, user=r.user))
        ).sanitize()
    except Exception:  # pylint: disable=broad-exception-caught
        CONSOLE.print_exception()
        return None


@ROUTER.put("/update/{pk}", response_model=ReminderDTO | None)
def update_reminder(pk: int, reminder: ReminderDTO) -> ReminderDTO | None:
    """Update reminder by ID"""
    r: Final[ReminderDTO | None] = sanitize(reminder)
    if not r:
        return None
    try:
        if DEBUG:
            log("Updating reminder", str(r))
        get_all_reminders.cache_clear()
        return (
            get_one_reminder(pk)
            if Reminder.update(date=r.date, event=r.event, description=r.description).where(Reminder.id == pk).execute()
            > 0
            else None
        )
    except Exception:  # pylint: disable=broad-exception-caught
        CONSOLE.print_exception()
        return None


@ROUTER.delete("/delete/{pk}", response_model=bool)
def delete_reminder(pk: int) -> bool:
    """Delete reminder by ID"""
    try:
        reminder: Final[Reminder | None] = Reminder.get_or_none(Reminder.id == pk)
        if reminder:
            get_all_reminders.cache_clear()
            reminder.delete_instance()
        else:
            if DEBUG:
                log("Could not delete ID", str(pk))
            return False
        if DEBUG:
            log("Deleting reminder ID", str(pk))
    except Exception:  # pylint: disable=broad-exception-caught
        CONSOLE.print_exception()
        return False
    return True


def validate_port(port: int) -> bool:
    """Validate port number"""
    port_min: Final[int] = 1024
    port_max: Final[int] = 65535
    return port_min <= port <= port_max


def invalid_port(port: int) -> None:
    """Invalid port"""
    msg: Final[str] = f"Invalid port: {port}"
    raise ValueError(msg)


try:
    PORT: Final[int] = int(getenv("API_PORT", "5559"))
    if not validate_port(PORT):
        invalid_port(PORT)
    elif DEBUG:
        log("Got port", str(PORT))
except Exception as e:  # pylint: disable=broad-exception-caught
    CONSOLE.print_exception()
    raise SystemExit(1) from e

API: Final[FastAPI] = FastAPI(docs_url="/api/docs", openapi_url="/api/openapi.json", redoc_url="/api/redoc")
API.include_router(ROUTER)

if __name__ == "__main__":
    CONSOLE.print("✨ Running local server...")
    if DEBUG:
        CONSOLE.print("🐞 Debug is ON")
    run("api:API", host="0.0.0.0", port=PORT, reload=True)  # noqa: S104
