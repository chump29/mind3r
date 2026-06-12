import { describe, expect, test } from "bun:test"

import { fakerEN_US as fake } from "@faker-js/faker"

import { type IReminder } from "../../src/components/shared/IReminder.ts"
import { SortBy, SortOrder } from "../../src/components/shared/index.ts"
import {
  displayStore,
  setEditing,
  setFilteredData,
  setIsAdding,
  setSearch,
  setSortBy,
  setSortOrder
} from "../../src/components/shared/store.ts"
import { generateReminders } from "../helpers.ts"

describe("store", (): void => {
  const reminders: IReminder[] = generateReminders()

  test("setEditing", (): void => {
    const reminder: IReminder = reminders[0] as IReminder

    setEditing(reminder)

    expect(displayStore.getState().editing).toEqual(reminders[0] as IReminder)
  })

  test("setFilteredData", (): void => {
    setFilteredData(reminders)

    expect(displayStore.getState().filteredData).toEqual(reminders)
  })

  test("setIsAdding", (): void => {
    const isAdding: boolean = fake.datatype.boolean()

    setIsAdding(isAdding)

    expect(displayStore.getState().isAdding).toEqual(isAdding)
  })

  test("setSortOrder", (): void => {
    const sortOrder: SortOrder = fake.helpers.objectValue(SortOrder)

    setSortOrder(sortOrder)

    expect(displayStore.getState().sortOrder).toEqual(sortOrder)
  })

  test("setSearch", (): void => {
    const search: string = fake.word.sample()

    setSearch(search)

    expect(displayStore.getState().search).toEqual(search)
  })

  test("setSortBy", (): void => {
    const sortBy: SortBy = fake.helpers.objectValue(SortBy)

    setSortBy(sortBy)

    expect(displayStore.getState().sortBy).toEqual(sortBy)
  })
})
