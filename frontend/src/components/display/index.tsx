import { type ChangeEvent, type JSX, type KeyboardEvent, type RefObject, useEffect, useRef } from "react"

import { info } from "@postfmly/logger"

import { default as pluralize } from "@jarrodek/pluralize"
import {
  ActionIcon,
  Anchor,
  Box,
  Button,
  Center,
  Group,
  Modal,
  Table,
  Text,
  Textarea,
  TextInput,
  Tooltip,
  UnstyledButton
} from "@mantine/core"
import { DateTimePicker } from "@mantine/dates"
import { useField, useForm } from "@mantine/form"
import { useDisclosure, useLocalStorage } from "@mantine/hooks"
import { modals } from "@mantine/modals"
import {
  IconCancel,
  IconCheck,
  IconChevronDown,
  IconChevronUp,
  IconKey,
  IconPencil,
  IconPlus,
  IconSearch,
  IconSelector,
  IconSend,
  IconTrash,
  IconX
} from "@tabler/icons-react"
import { default as dayjs } from "dayjs"
import { default as advancedFormat } from "dayjs/plugin/advancedFormat"
import { filterData as filter, SearchType } from "filter-data"
import { default as httpMethods } from "http-methods-constants"
import { default as ms } from "ms"
import { default as useSWR } from "swr/immutable"
import { type SafeParseResult, safeParse } from "valibot"

import { type IReminder } from "../shared/IReminder.ts"
import { type IUser, vUserSchema } from "../shared/IUser.ts"
import { FetchError, handleError, SortBy, SortOrder, validate } from "../shared/index.ts"
import {
  BooleanSchema,
  DATETIME_FORMAT,
  EventSchema,
  getDateTime,
  MAX_LEN_DESCRIPTION,
  MAX_LEN_EVENT,
  MAX_LEN_NAME,
  MAX_LEN_SEARCH,
  SearchSchema,
  TimeoutSchema,
  UrlSchema,
  UserSchema
} from "../shared/schemas.ts"
import {
  displayStore,
  type IDisplay,
  setEditing,
  setFilteredData,
  setIsAdding,
  setSearch,
  setSortBy,
  setSortOrder
} from "../shared/store.ts"

import "./index.css"

dayjs.extend(advancedFormat)

const debug: SafeParseResult<BooleanSchema> = safeParse(BooleanSchema, import.meta.env.VITE_DEBUG)
const DEBUG: boolean = debug.success ? debug.output : false
if (DEBUG) {
  info("Debug is ON")
}

const api_url: SafeParseResult<UrlSchema> = safeParse(UrlSchema, import.meta.env.VITE_API_URL)
const API_URL: string = `${api_url.success ? api_url.output : ""}/api`

const api_timeout: SafeParseResult<TimeoutSchema> = safeParse(TimeoutSchema, import.meta.env.VITE_API_TIMEOUT)
const API_TIMEOUT: number = api_timeout.success ? api_timeout.output : ms("2s")

const Th = ({
  children,
  label,
  reversed,
  sorted,
  onSort
}: {
  children: React.ReactNode
  label: string
  reversed: boolean
  sorted: boolean
  onSort: () => void
}): JSX.Element => {
  const upDownIcon = reversed ? IconChevronUp : IconChevronDown
  const Icon = sorted ? upDownIcon : IconSelector

  return (
    <Table.Th p={0} ta="center">
      <Tooltip label={`Sort by ${label}`} withArrow={true}>
        <UnstyledButton onClick={onSort}>
          <Group justify="space-between">
            <Text fw="bold">{children}</Text>
            <Center
              h={21}
              style={{
                borderRadius: "21px"
              }}
              w={21}>
              <Icon size={16} stroke={1.5} />
            </Center>
          </Group>
        </UnstyledButton>
      </Tooltip>
    </Table.Th>
  )
}

const Display = (): JSX.Element => {
  const editing: IReminder | null = displayStore((store: IDisplay): IReminder | null => store.editing)
  const filteredData: IReminder[] = displayStore((store: IDisplay): IReminder[] => store.filteredData)
  const isAdding: boolean = displayStore((store: IDisplay): boolean => store.isAdding)
  const search: string = displayStore((store: IDisplay): string => store.search)
  const sortBy: SortBy = displayStore((store: IDisplay): SortBy => store.sortBy)
  const sortOrder: SortOrder = displayStore((store: IDisplay): SortOrder => store.sortOrder)

  const form = useForm<IReminder>({
    initialValues: {
      date: getDateTime(),
      description: null,
      event: "",
      id: null,
      user: null
    },
    validate: {
      event: (s: string): string | null => {
        const e: SafeParseResult<EventSchema> = safeParse(EventSchema, s)
        return e.success ? null : e.issues[0].message
      }
    }
  })

  const nameField = useField<string>({
    initialValue: "",
    validateOnChange: true,
    validate: (s: string): string | null => (s.length > 0 ? null : "Must enter a name")
  })

  const [openedLogin, { open: openLogin, close: closeLogin }] = useDisclosure(false)

  const userValue: RefObject<string | null> = useRef<string | null>(null)

  const [user, setUser, resetUser] = useLocalStorage<string>({
    defaultValue: undefined,
    key: "mind3rUser"
  })

  const fetchData = async (url: string): Promise<IReminder[]> => {
    if (!user) {
      return []
    }

    const userObj: IUser = {
      user
    } satisfies IUser
    const u: SafeParseResult<vUserSchema> = safeParse(vUserSchema, userObj)
    if (!u.success) {
      throw new Error("Invalid user")
    }

    return await fetch(url, {
      body: JSON.stringify(u.output),
      method: httpMethods.POST,
      signal: AbortSignal.timeout(API_TIMEOUT),
      headers: {
        "Content-Type": "application/json"
      }
    })
      .then(async (response: Response): Promise<IReminder[]> => {
        if (!response.ok) {
          throw new FetchError(response)
        }

        return await response.json()
      })
      .then((reminders: IReminder[] | null): IReminder[] => {
        if (!reminders) {
          return []
        }

        const r: IReminder[] = validate<IReminder[]>(reminders)

        if (DEBUG) {
          info(`Got ${pluralize("reminder", r.length, true)} from API`)
        }

        return r
      })
      .catch((e: Error): IReminder[] => {
        handleError(e)
        return []
      })
  }

  const { data = [], mutate: refreshData } = useSWR(user ? `${API_URL}/get` : null, fetchData, {
    onSuccess: (d: IReminder[]): void => {
      setFilteredData(d)

      handleSort(SortBy.DATE, SortOrder.ASC)()
    }
  })

  const filterData = (): void => {
    const currentSearch: string = displayStore.getState().search

    if (DEBUG) {
      info(`Filter by: ${currentSearch === "" ? "[NONE]" : currentSearch}`)
    }

    if (currentSearch === "") {
      setFilteredData(data)

      if (DEBUG) {
        info("Filter reset")
      }
    } else {
      setFilteredData(
        filter(filteredData, [
          {
            type: SearchType.LK,
            value: currentSearch,
            key: [
              "description",
              "event"
            ]
          }
        ])
      )
    }

    if (DEBUG) {
      info(`${pluralize("reminder", displayStore.getState().filteredData.length, true)} remaining`)
    }
  }

  const handleSort =
    (sb: SortBy = SortBy.DATE, so: SortOrder | null = null) =>
    (): void => {
      if (so) {
        setSortOrder(so)
      } else if (sb === sortBy) {
        setSortOrder(sortOrder === SortOrder.ASC ? SortOrder.DESC : SortOrder.ASC)
      } else {
        setSortOrder(SortOrder.ASC)
      }

      setSortBy(sb)

      const currentSortBy: SortBy = displayStore.getState().sortBy
      const currentSortOrder: SortOrder = displayStore.getState().sortOrder

      if (DEBUG) {
        info(
          `Sort by: ${currentSortBy === SortBy.DATE ? "Date/Time" : "Event"} (${currentSortOrder === SortOrder.ASC ? "ASC" : "DESC"})`
        )
      }

      setFilteredData(
        displayStore.getState().filteredData.sort((a: IReminder, b: IReminder): number => {
          if (currentSortBy === SortBy.EVENT) {
            if (currentSortOrder === SortOrder.ASC) {
              return a.event.localeCompare(b.event)
            }
            return b.event.localeCompare(a.event)
          }
          if (currentSortOrder === SortOrder.ASC) {
            return dayjs(a.date).diff(dayjs(b.date))
          }
          return dayjs(b.date).diff(dayjs(a.date))
        })
      )

      if (DEBUG) {
        info(`Sorted ${pluralize("reminder", displayStore.getState().filteredData.length, true)}`)
      }
    }

  const filterAndSort =
    (value: string = "") =>
    (): void => {
      setSearch(value) // * NOTE: already validated

      filterData()

      handleSort(sortBy, sortOrder)()
    }

  const handleCancel = (): void => {
    setIsAdding(false)

    setEditing(null)

    form.reset()
  }

  const showConfirm =
    (id: number, skipConfirm: boolean = false) =>
    async (): Promise<void> => {
      if (skipConfirm) {
        await handleDelete(id)
        return
      }

      modals.openConfirmModal({
        centered: true,
        children: (
          <Text size="sm">Are you sure that you want to delete this reminder? This action cannot be undone.</Text>
        ),
        title: "Delete reminder?",
        cancelProps: {
          "data-testid": "testCancel"
        },
        confirmProps: {
          color: "red",
          "data-testid": "testConfirm"
        },
        labels: {
          cancel: "Do not delete",
          confirm: "Delete reminder"
        },
        onCancel: (): void => {
          if (DEBUG) {
            info("Delete canceled")
          }
        },
        onConfirm: async (): Promise<void> => {
          if (DEBUG) {
            info("Delete confirmed")
          }

          await handleDelete(id)
        }
      })
    }

  const handleDelete = async (id: number): Promise<void> => {
    await fetch(`${API_URL}/delete/${id}`, {
      method: httpMethods.DELETE,
      signal: AbortSignal.timeout(API_TIMEOUT)
    })
      .then(async (response: Response): Promise<boolean> => {
        if (!response.ok) {
          throw new FetchError(response)
        }

        return await response.json()
      })
      .then(async (deleted: boolean): Promise<void> => {
        if (!deleted) {
          throw new Error(`Could not delete ID ${id}`)
        }

        if (DEBUG) {
          info(`Deleted reminder ID ${id}`)
        }

        await refreshData()
      })
      .catch(handleError)
  }

  const handleSubmit = async (reminder: IReminder): Promise<void> => {
    if (!user) {
      return
    }

    reminder.user = user

    const r: IReminder = validate<IReminder>(reminder)

    if (editing) {
      if (editing.date === r.date && editing.event === r.event && editing.description === r.description) {
        if (DEBUG) {
          info(`No update for reminder ID ${editing.id}`)
        }

        return handleCancel()
      }

      if (DEBUG) {
        info("Editing reminder:")
        console.table(r)
      }

      await fetch(`${API_URL}/update/${editing.id}`, {
        body: JSON.stringify(r),
        method: httpMethods.PUT,
        signal: AbortSignal.timeout(API_TIMEOUT),
        headers: {
          "Content-Type": "application/json"
        }
      })
        .then(async (response: Response): Promise<IReminder> => {
          if (!response.ok) {
            throw new FetchError(response)
          }

          return await response.json()
        })
        .then(async (reminderObj: IReminder): Promise<void> => {
          if (!reminderObj) {
            throw new Error(`Could not update reminder ID ${(editing satisfies IReminder).id}`)
          }

          const validatedReminder: IReminder = validate<IReminder>(reminderObj)

          if (DEBUG) {
            info(`Updated reminder ID ${validatedReminder.id}`)
          }

          await refreshData()
        })
        .catch(handleError)
    } else {
      if (DEBUG) {
        info("Adding new reminder:")
        console.table(r)
      }

      await fetch(`${API_URL}/add`, {
        body: JSON.stringify(r),
        method: httpMethods.POST,
        signal: AbortSignal.timeout(API_TIMEOUT),
        headers: {
          "Content-Type": "application/json"
        }
      })
        .then(async (response: Response): Promise<IReminder> => {
          if (!response.ok) {
            throw new FetchError(response)
          }

          return await response.json()
        })
        .then(async (reminderObj: IReminder): Promise<void> => {
          if (!reminderObj) {
            throw new Error(`Could not add reminder: ${r.event}`)
          }

          const validatedReminder: IReminder = validate<IReminder>(reminderObj)

          if (DEBUG) {
            info(`Added reminder ID ${validatedReminder.id}`)
          }

          await refreshData()
        })
        .catch(handleError)
    }

    handleCancel()
  }

  const handleEdit = (id: number) => (): void => {
    const foundReminder: IReminder | undefined = data.find((reminder: IReminder): boolean => reminder.id === id)
    if (foundReminder) {
      setIsAdding(true)

      setEditing(foundReminder)

      form.setValues(foundReminder)

      if (DEBUG) {
        info(`Editing reminder ID ${id}`)
      }
    }
  }

  const getRows = (): JSX.Element[] =>
    filteredData.map(
      (row: IReminder): JSX.Element => (
        <Table.Tr key={row.id}>
          <Table.Td ta="center" w={300}>
            {dayjs(row.date).local().format(DATETIME_FORMAT)}
          </Table.Td>
          <Table.Td w={400}>{row.event}</Table.Td>
          <Table.Td
            style={{
              wordBreak: "break-word"
            }}
            w={450}>
            {row.description}
          </Table.Td>
          <Table.Td ta="center" w={100}>
            <Tooltip label="Edit" withArrow={true}>
              <ActionIcon
                color="var(--color-og107)"
                data-testid={`testEdit-${row.id}`}
                onClick={handleEdit(row.id as number)}
                variant="outline">
                <IconPencil color="yellow" size={16} />
              </ActionIcon>
            </Tooltip>
            <Tooltip label="Delete" withArrow={true}>
              <ActionIcon
                color="var(--color-og107)"
                data-testid={`testDelete-${row.id}`}
                ml={10}
                onClick={showConfirm(row.id as number)}
                variant="outline">
                <IconTrash color="yellow" size={16} />
              </ActionIcon>
            </Tooltip>
          </Table.Td>
        </Table.Tr>
      )
    )

  const setUserAndRefresh = (): void => {
    new Promise<void>((resolve): void => {
      setUser(userValue.current ?? undefined)

      if (DEBUG) {
        info(`User logged in as ${userValue.current}`)
      }

      resolve()
    }).then(async (): Promise<void> => {
      await refreshData()
    })
  }

  const resetUserAndRefresh = (): void => {
    new Promise<void>((resolve): void => {
      userValue.current = null
      resetUser()

      if (DEBUG) {
        info("User logged out")
      }

      resolve()
    }).then((): void => {
      setFilteredData([])
    })
  }

  const handleNameChange = (e: ChangeEvent<HTMLInputElement>): void => {
    const u: SafeParseResult<UserSchema> = safeParse(UserSchema, e.target.value)
    userValue.current = u.success ? u.output : null
    nameField.setValue(userValue.current ?? "")
  }

  const handleNameChangeKeyDown = (e: KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === "Enter") {
      closeLogin()
      setUserAndRefresh()
    }
  }

  const handleNameConfirm = (): void => {
    closeLogin()
    setUserAndRefresh()
  }

  const handleNameCancel = (): void => {
    closeLogin()
    if (userValue.current !== user) {
      resetUser()
    }
  }

  const handleLogout = (): void => {
    resetUserAndRefresh()
  }

  const handleLogin = (): void => {
    userValue.current = user ?? null
    openLogin()
    nameField.setValue("")
    nameField.validate()
  }

  const handleSearch = (e: ChangeEvent<HTMLInputElement>): void => {
    const s: SafeParseResult<SearchSchema> = safeParse(SearchSchema, e.currentTarget.value)
    filterAndSort(s.success ? s.output : undefined)()
  }

  const handleDateTime = (s: string | null): void => form.setFieldValue("date", dayjs(s).toISOString())

  const handleDescription = (e: ChangeEvent<HTMLTextAreaElement>): void =>
    e.currentTarget.value.length > 0
      ? form.setFieldValue("description", e.currentTarget.value)
      : form.setFieldValue("description", null)

  const handleAdd = (): void => setIsAdding(true)

  // biome-ignore lint/correctness/useExhaustiveDependencies: loading from localStorage
  useEffect((): void => {
    const userFromStorage: string | null = localStorage.getItem("mind3rUser")
    if (userFromStorage) {
      const validatedUser: SafeParseResult<UserSchema> = safeParse(UserSchema, userFromStorage)
      const val: string | null = validatedUser.success ? validatedUser.output : null
      userValue.current = val
      setUser(val ?? undefined)
      if (DEBUG) {
        info(`User set to: ${val}`)
      }
    }
  }, [])

  return (
    <>
      <Modal centered={true} onClose={closeLogin} opened={openedLogin} size="auto" withCloseButton={false}>
        <Tooltip label="Name" withArrow={true}>
          <TextInput
            {...nameField.getInputProps()}
            data-testid="testName"
            label="Name"
            maxLength={MAX_LEN_NAME}
            onChange={handleNameChange}
            onKeyDown={handleNameChangeKeyDown}
            placeholder="Enter name..."
            rightSection={
              <>
                <Tooltip label="Confirm" withArrow={true}>
                  <IconCheck
                    color="green"
                    onClick={handleNameConfirm}
                    size={16}
                    style={{
                      cursor: "pointer",
                      marginRight: "5px"
                    }}
                  />
                </Tooltip>
                <Tooltip label="Cancel" withArrow={true}>
                  <IconX
                    color="red"
                    onClick={handleNameCancel}
                    size={16}
                    style={{
                      cursor: "pointer",
                      marginRight: "5px"
                    }}
                  />
                </Tooltip>
              </>
            }
            withAsterisk={true}
          />
        </Tooltip>
      </Modal>
      <Group
        style={{
          left: "10px",
          position: "fixed",
          top: "10px"
        }}>
        {user ? (
          <Text c="dimmed" fs="italic" size="xs">
            Logged in as:{" "}
            <Tooltip label="Log Out" withArrow={true}>
              <Anchor c="blue" onClick={handleLogout}>
                {user}
              </Anchor>
            </Tooltip>
          </Text>
        ) : (
          <Tooltip label="Log In" withArrow={true}>
            <Button
              c="var(--mantine-color-dark-0)"
              color="var(--color-og107)"
              data-testid="testLogin"
              leftSection={<IconKey color="yellow" size={16} />}
              onClick={handleLogin}
              size="xs"
              variant="outline">
              Log In
            </Button>
          </Tooltip>
        )}
      </Group>
      <Box
        display="flex"
        mt={50}
        style={{
          justifyContent: "center"
        }}
        w="100%">
        <Box bd="1px solid var(--color-og107)" bdrs={6} p={20}>
          <Center>
            <TextInput
              data-testid="testSearch"
              disabled={data.length === 0}
              leftSection={<IconSearch color="white" size={16} />}
              maxLength={MAX_LEN_SEARCH}
              onChange={handleSearch}
              placeholder="Search by Event or Description..."
              rightSection={
                <Tooltip label="Clear" withArrow={true}>
                  <IconX
                    color="red"
                    onClick={filterAndSort(undefined)}
                    size={16}
                    style={{
                      cursor: "pointer"
                    }}
                  />
                </Tooltip>
              }
              value={search}
              w={600}
            />
          </Center>
          <Table data-testid="testTable" highlightOnHover={true} mt={20}>
            <Table.Tbody>
              <Table.Tr>
                <Th
                  label="Date/Time"
                  onSort={handleSort(SortBy.DATE, sortOrder === SortOrder.ASC ? SortOrder.DESC : SortOrder.ASC)}
                  reversed={sortOrder === SortOrder.ASC}
                  sorted={sortBy === SortBy.DATE}>
                  📅 Date/Time
                </Th>
                <Th
                  label="Event"
                  onSort={handleSort(SortBy.EVENT, sortOrder === SortOrder.ASC ? SortOrder.DESC : SortOrder.ASC)}
                  reversed={sortOrder === SortOrder.ASC}
                  sorted={sortBy === SortBy.EVENT}>
                  📌 Event
                </Th>
                <Table.Th
                  style={{
                    cursor: "default"
                  }}
                  ta="center">
                  📝 Description
                </Table.Th>
                <Table.Th
                  style={{
                    cursor: "default"
                  }}
                  ta="center">
                  ⚡ Actions
                </Table.Th>
              </Table.Tr>
            </Table.Tbody>
            <Table.Tbody>
              {filteredData.length > 0 ? (
                getRows()
              ) : (
                <Table.Tr>
                  <Table.Td colSpan={4}>
                    <Text
                      c="var(--color-og107)"
                      fs="italic"
                      fw="bold"
                      fz="h2"
                      mb={10}
                      mt={20}
                      style={{
                        fontVariant: "small-caps"
                      }}
                      ta="center">
                      No reminders to display
                    </Text>
                    {user ? null : (
                      <Text
                        c="var(--color-og107)"
                        fw="bold"
                        fz="h4"
                        mb={10}
                        mt={20}
                        style={{
                          fontVariant: "small-caps"
                        }}
                        ta="center">
                        ⚠️ Please log in ⚠️
                      </Text>
                    )}
                  </Table.Td>
                </Table.Tr>
              )}
            </Table.Tbody>
          </Table>
          <Box mt={20} ta="center">
            {isAdding ? (
              <>
                <Tooltip label="Cancel" withArrow={true}>
                  <Button
                    c="var(--mantine-color-dark-0)"
                    color="var(--color-og107)"
                    data-testid="testCancel"
                    leftSection={<IconCancel color="red" />}
                    onClick={handleCancel}
                    variant="outline">
                    Cancel
                  </Button>
                </Tooltip>
                <Box
                  bd="1px solid var(--color-og107)"
                  bdrs={6}
                  display="flex"
                  mt={20}
                  p={20}
                  style={{
                    justifyContent: "center"
                  }}>
                  <form data-testid="testForm" onSubmit={form.onSubmit(handleSubmit)}>
                    <Center>
                      <DateTimePicker
                        {...form.getInputProps("date")}
                        error={dayjs(form.values.date) < dayjs(getDateTime())}
                        highlightToday={true}
                        label="Date/Time"
                        minDate={getDateTime()}
                        onChange={handleDateTime}
                        timePickerProps={{
                          format: "12h",
                          minutesStep: 5,
                          withDropdown: true,
                          popoverProps: {
                            withinPortal: false
                          }
                        }}
                        value={dayjs(form.values.date).local().format()}
                        valueFormat={DATETIME_FORMAT}
                        w={300}
                        withAsterisk={true}
                        withSeconds={false}
                      />
                      <TextInput
                        {...form.getInputProps("event")}
                        data-testid="testEvent"
                        label="Event"
                        maxLength={MAX_LEN_EVENT}
                        ml={20}
                        placeholder="Enter event..."
                        value={form.values.event}
                        w={300}
                        withAsterisk={true}
                      />
                      <Textarea
                        {...form.getInputProps("description")}
                        data-testid="testDescription"
                        label="Description"
                        maxLength={MAX_LEN_DESCRIPTION}
                        maxRows={2}
                        minRows={1}
                        ml={20}
                        onChange={handleDescription}
                        placeholder="Enter description..."
                        value={form.values.description ?? ""}
                        w={300}
                      />
                      <Tooltip label="Submit" withArrow={true}>
                        <Button
                          c="var(--mantine-color-dark-0)"
                          color="var(--color-og107)"
                          data-testid="testSubmit"
                          leftSection={<IconSend color="green" />}
                          ml={20}
                          mt={20}
                          type="submit"
                          variant="outline">
                          Submit
                        </Button>
                      </Tooltip>
                    </Center>
                  </form>
                </Box>
              </>
            ) : (
              <Tooltip label="Add Event" withArrow={true}>
                <Button
                  c="var(--mantine-color-dark-0)"
                  color="var(--color-og107)"
                  data-testid="testAdd"
                  disabled={!user}
                  leftSection={<IconPlus color="green" />}
                  onClick={handleAdd}
                  variant="outline">
                  Add Event
                </Button>
              </Tooltip>
            )}
          </Box>
        </Box>
      </Box>
    </>
  )
}

export default Display
