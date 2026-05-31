#!.venv/bin/python

# pylint: disable=missing-function-docstring
# ruff: noqa: D103

# ! TODO
# pylint: disable=useless-return, unused-argument
# ruff: noqa: ERA001, ARG001

"""Environment setup"""

from typing import TYPE_CHECKING

# from api import MealDTO, Menu, add_meal, delete_meal  # pylint: disable=import-error

if TYPE_CHECKING:
    from behave.model import Feature
    from behave.runner import Context
else:
    Feature = object
    Context = object


def before_feature(context: Context, feature: Feature) -> None:
    if "crud" not in feature.tags:
        return


#    for menu in (
#        Menu.select().where(Menu.title == "TESTME").iterator()
#    ):  # * clean up old data
#        delete_meal(menu.id)
#    context.meal = add_meal(MealDTO(day=0, title="TESTME", description="TESTME"))
#    assert context.meal, "Could not add meal data"


def after_feature(context: Context, feature: Feature) -> None:
    if "crud" not in feature.tags:
        return


#    if not context.meal:
#        return
#    assert delete_meal(context.meal.id), "Could not delete meal data"
