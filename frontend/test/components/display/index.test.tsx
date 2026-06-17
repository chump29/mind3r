import { beforeAll, beforeEach, describe, expect, test } from "bun:test"

import { json, mockFetch, setPassthrough } from "@aryzing/bun-mock-fetch"
import { fakerEN_US as fake } from "@faker-js/faker"
import { MantineProvider } from "@mantine/core"
import { ModalsProvider } from "@mantine/modals"
import { act, configure, render, screen, waitFor } from "@testing-library/react"
import { type UserEvent, default as userEvent } from "@testing-library/user-event"
import { default as httpMethods } from "http-methods-constants"
import { default as ms } from "ms"
import { titleCase } from "title-case"

import Display from "../../../src/components/display/index.tsx"
import { displayStore } from "../../../src/components/shared/displayStore.ts"
import { type IReminder } from "../../../src/components/shared/IReminder.ts"
import { generateEvent, generateReminder, generateReminders, generateUser } from "../../fakes.ts"

configure({
  asyncUtilTimeout: ms("3s")
})

const data: IReminder[] = generateReminders()

const newData: IReminder = generateReminder()

beforeAll((): void => {
  setPassthrough(false)

  mockFetch(
    {
      method: httpMethods.GET,
      url: "/api/get"
    },
    () => json(data)
  )

  mockFetch(
    {
      method: httpMethods.POST,
      url: "/api/add"
    },
    json(newData)
  )

  mockFetch(
    {
      method: httpMethods.PUT,
      url: "/api/update/1"
    },
    json(newData)
  )

  mockFetch(
    {
      method: httpMethods.DELETE,
      url: "/api/delete/1"
    },
    json(true)
  )

  localStorage.setItem("mind3rUser", generateUser())
})

beforeEach(async (): Promise<void> => {
  await waitFor((): void => {
    act((): void => {
      render(
        <MantineProvider>
          <ModalsProvider>
            <Display />
          </ModalsProvider>
        </MantineProvider>
      )
    })
  })
})

describe("index", (): void => {
  test("logged in", (): void => {
    expect(localStorage.getItem("mind3rUSer")).not.toBeUndefined()
  })

  test("fetchData", (): void => {
    expect(displayStore.getState().filteredData).toBeArrayOfSize(data.length)
  })

  test("display search bar", (): void => {
    expect(screen.getByTestId("testSearch")).toBeInTheDocument()
  })

  test("display table", (): void => {
    expect(screen.getByTestId("testTable")).toBeInTheDocument()
  })

  test("display add button", (): void => {
    expect(screen.getByTestId("testAdd")).toBeInTheDocument()
  })

  test("add and cancel buttons", async (): Promise<void> => {
    const user: UserEvent = userEvent.setup()

    await waitFor(async (): Promise<void> => {
      await user.click(screen.getByTestId("testAdd"))
      console.info("💥 Add button clicked")
    })

    expect(screen.queryByTestId("testAdd")).toBeNull()

    expect(screen.getByTestId("testCancel")).toBeInTheDocument()
    expect(screen.getByTestId("testForm")).toBeInTheDocument()

    await waitFor(async (): Promise<void> => {
      await user.click(screen.getByTestId("testCancel"))
      console.info("💥 Cancel button clicked")
    })

    expect(screen.queryByTestId("testCancel")).toBeNull()
    expect(screen.getByTestId("testAdd")).toBeInTheDocument()
  })

  test("add reminder", async (): Promise<void> => {
    const user: UserEvent = userEvent.setup()

    await waitFor(async (): Promise<void> => {
      await user.click(screen.getByTestId("testAdd"))
      console.info("💥 Add button clicked")
    })

    await waitFor(async (): Promise<void> => {
      const testEvent: HTMLInputElement = screen.getByTestId("testEvent")
      await user.clear(testEvent)
      await user.type(testEvent, newData.event)
      console.info("💥 Added event title")
    })

    await waitFor(async (): Promise<void> => {
      const testDescription: HTMLInputElement = screen.getByTestId("testDescription")
      await user.clear(testDescription)
      await user.type(testDescription, newData.description as string)
      console.info("💥 Added event description")
    })

    data.push(newData)

    await waitFor(async (): Promise<void> => {
      console.info("💥 Submit button clicked")
      await user.click(screen.getByTestId("testSubmit"))
    })

    expect(screen.queryByTestId("testCancel")).toBeNull()
    expect(screen.getByTestId("testAdd")).toBeInTheDocument()
    expect(displayStore.getState().filteredData).toBeArrayOfSize(data.length)
  })

  test("edit reminder", async (): Promise<void> => {
    const user: UserEvent = userEvent.setup()

    await waitFor(async (): Promise<void> => {
      await userEvent.click(screen.getByTestId("testEdit-1"))
      console.info("💥 Edit button clicked")
    })

    const newEvent: string = generateEvent()

    await waitFor(async (): Promise<void> => {
      const testEvent: HTMLInputElement = screen.getByTestId("testEvent")
      await userEvent.clear(testEvent)
      await userEvent.type(testEvent, newEvent)
      console.info("💥 Edited event")
    })

    const r: IReminder = data.find((reminder: IReminder): boolean => reminder.id === 1) as IReminder
    console.info(`⚠️  Old: ${titleCase(r.event)}, New: ${titleCase(newEvent)}`)
    r.event = newEvent

    await waitFor(async (): Promise<void> => {
      console.info("💥 Submit button clicked")
      await user.click(screen.getByTestId("testSubmit"))
    })

    expect(displayStore.getState().filteredData.find((reminder: IReminder): boolean => reminder.id === 1)?.event).toBe(
      titleCase(newEvent)
    )
  })

  test("edit reminder - no update", async (): Promise<void> => {
    const user: UserEvent = userEvent.setup()

    await waitFor(async (): Promise<void> => {
      await userEvent.click(screen.getByTestId(`testEdit-${data.length - 1}`))
      console.info("💥 Edit button clicked")
    })

    console.info("💥 No update")

    await waitFor(async (): Promise<void> => {
      console.info("💥 Submit button clicked")
      await user.click(screen.getByTestId("testSubmit"))
    })

    const dataReminder: IReminder = data[0] as IReminder
    const storeReminder: IReminder = displayStore
      .getState()
      .filteredData.find((reminder: IReminder): boolean => reminder.id === dataReminder.id) as IReminder

    expect(storeReminder.event).toBe(titleCase(dataReminder.event))
  })

  test("delete reminder", async (): Promise<void> => {
    const user: UserEvent = userEvent.setup()

    data.splice(
      data.findIndex((reminder: IReminder): boolean => reminder.id === 1),
      1
    )

    await waitFor(async (): Promise<void> => {
      await user.click(screen.getByTestId("testDelete-1"))
      console.info("💥 Delete button clicked")

      console.info("💥 Confirm button clicked")
      await user.click(screen.getByTestId("testConfirm"))
    })

    expect(displayStore.getState().filteredData).toBeArrayOfSize(data.length)
  })

  test("cancel delete reminder", async (): Promise<void> => {
    const user: UserEvent = userEvent.setup()

    await waitFor(async (): Promise<void> => {
      await user.click(screen.getByTestId(`testDelete-${data.length - 1}`))
      console.info("💥 Delete button clicked")

      console.info("💥 Cancel button clicked")
      await user.click(screen.getByTestId("testCancel"))
    })

    expect(displayStore.getState().filteredData).toBeArrayOfSize(data.length)
  })

  test("filter reminders", async (): Promise<void> => {
    const user: UserEvent = userEvent.setup()

    const MIN_WORD_LEN: number = 3
    const search: string = fake.word.sample(MIN_WORD_LEN)

    ;(displayStore.getState().filteredData.at(-1) as IReminder).description = search

    const testSearch: HTMLInputElement = screen.getByTestId("testSearch")

    await waitFor(async (): Promise<void> => {
      await user.clear(testSearch)
      console.info("💥 Searching")
      await user.type(testSearch, search)
    })

    expect(displayStore.getState().filteredData).toBeArrayOfSize(1)

    await waitFor(async (): Promise<void> => {
      console.info("💥 Cleared search")
      await user.clear(testSearch)
    })

    expect(displayStore.getState().filteredData).toBeArrayOfSize(data.length)
  })
})
