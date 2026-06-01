import { describe, expect, test } from "bun:test"

import { rand, randBoolean, randSoonDate, randWord } from "@ngneat/falso"

import { type IReminder } from "./IReminder.ts"
import { SortBy, SortOrder } from "./index.ts"
import { displayStore, setEditing, setFilteredData, setIsAdding, setSearch, setSortBy, setSortOrder } from "./store.ts"

describe("store", (): void => {
  const reminders: IReminder[] = [
    {
      date: randSoonDate().toISOString(),
      description: null,
      event: randWord({
        capitalize: true
      }),
      id: null
    } satisfies IReminder
  ]

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
    const isAdding: boolean = randBoolean()

    setIsAdding(isAdding)

    expect(displayStore.getState().isAdding).toEqual(isAdding)
  })

  test("setSortOrder", (): void => {
    const sortOrder: SortOrder = rand(Object.values(SortOrder))

    setSortOrder(sortOrder)

    expect(displayStore.getState().sortOrder).toEqual(sortOrder)
  })

  test("setSearch", (): void => {
    const search: string = randWord()

    setSearch(search)

    expect(displayStore.getState().search).toEqual(search)
  })

  test("setSortBy", (): void => {
    const sortBy: SortBy = rand(Object.values(SortBy))

    setSortBy(sortBy)

    expect(displayStore.getState().sortBy).toEqual(sortBy)
  })
})
