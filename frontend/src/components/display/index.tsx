import { type ChangeEvent, type JSX, type RefObject, useEffect, useRef } from "react"

import { error, info } from "@postfmly/logger"

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
import { useForm } from "@mantine/form"
import { useDisclosure } from "@mantine/hooks"
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
import { default as useLocalStorageState } from "use-local-storage-state"
import { nonEmpty, parseBoolean, pipe, safeParse, string, trim } from "valibot"

import { type IReminder } from "../shared/IReminder.ts"
import { FetchError, handleError, SortBy, SortOrder, validate } from "../shared/index.ts"
import {
  DATETIME_FORMAT,
  DateTimeSchema,
  DescriptionSchema,
  EventSchema,
  MAX_LEN_DESCRIPTION,
  MAX_LEN_EVENT
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

import "@mantine/core/styles.layer.css"
import "@mantine/dates/styles.layer.css"

dayjs.extend(advancedFormat)

const d = safeParse(pipe(string(), trim(), nonEmpty(), parseBoolean()), import.meta.env.VITE_DEBUG)
const DEBUG: boolean = d.success ? d.output : false
if (DEBUG) {
  info("Debug is ON")
}

const API_URL: string = `${import.meta.env.VITE_API_URL || ""}/api`
const API_TIMEOUT: number = ms("3s")

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
  const Icon = sorted ? (reversed ? IconChevronUp : IconChevronDown) : IconSelector

  return (
    <Table.Th p={0} ta="center">
      <Tooltip label={`Sort by ${label}`} withArrow>
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
      date: dayjs().add(1, "m").toISOString(),
      description: null,
      event: "",
      id: null,
      user: null
    },
    validate: {
      date: (s: string): string | null => {
        const d = safeParse(DateTimeSchema, s)
        return d.success ? null : d.issues[0].message
      },
      description: (s: string | null): string | null => {
        const d = safeParse(DescriptionSchema, s)
        return d.success ? null : d.issues[0].message
      },
      event: (s: string): string | null => {
        const e = safeParse(EventSchema, s)
        return e.success ? null : e.issues[0].message
      }
    }
  })

  const [openedLogin, { open: openLogin, close: closeLogin }] = useDisclosure(false)

  const userValue: RefObject<string | undefined> = useRef<string | undefined>(undefined)

  const [user, setUser, { removeItem: resetUser, isPersistent: useLocalStorage }] = useLocalStorageState<string>(
    "mind3rUser",
    {
      defaultValue: undefined
    }
  )

  if (!useLocalStorage) {
    error("localStorage not being used")
  }

  const fetchData = async (url: string): Promise<IReminder[]> => {
    return await fetch(url, {
      body: user,
      method: httpMethods.POST,
      signal: AbortSignal.timeout(API_TIMEOUT)
    })
      .then(async (response: Response): Promise<IReminder[]> => {
        if (!response.ok) {
          throw new FetchError(response)
        }

        return await response.json()
      })
      .then(async (reminders: IReminder[]): Promise<IReminder[]> => {
        reminders = await validate<IReminder[]>(reminders)

        if (DEBUG) {
          info(`Got ${pluralize("reminder", reminders.length, true)} from API`)
        }

        return reminders
      })
      .catch((e: Error): IReminder[] => {
        handleError(e)
        return []
      })
  }

  const { data = [], mutate: refreshData } = useSWR(`${API_URL}/get`, fetchData, {
    onSuccess: (data: IReminder[]): void => {
      setFilteredData(data)

      handleSort(SortBy.DATE, SortOrder.ASC)
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

  const handleSort = (sb: SortBy = SortBy.DATE, so: SortOrder | null = null): void => {
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
        } else {
          if (currentSortOrder === SortOrder.ASC) {
            return dayjs(a.date).diff(dayjs(b.date))
          }
          return dayjs(b.date).diff(dayjs(a.date))
        }
      })
    )

    if (DEBUG) {
      info(`Sorted ${pluralize("reminder", displayStore.getState().filteredData.length, true)}`)
    }
  }

  const filterAndSort = (value: string = ""): void => {
    setSearch(value.trim())

    filterData()

    handleSort(sortBy, sortOrder)
  }

  const handleCancel = (): void => {
    setIsAdding(false)

    setEditing(null)

    form.reset()
  }

  const showConfirm = async (id: number, skipConfirm: boolean = false): Promise<void> => {
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
    reminder.user = user

    const r: IReminder = await validate<IReminder>(reminder)

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
        .then(async (reminder: IReminder): Promise<void> => {
          if (!reminder) {
            throw new Error(`Could not update reminder ID ${(editing satisfies IReminder).id}`)
          }

          reminder = await validate<IReminder>(reminder)

          if (DEBUG) {
            info(`Updated reminder ID ${reminder.id}`)
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
        .then(async (reminder: IReminder): Promise<void> => {
          if (!reminder) {
            throw new Error(`Could not add reminder: ${r.event}`)
          }

          reminder = await validate<IReminder>(reminder)

          if (DEBUG) {
            info(`Added reminder ID ${reminder.id}`)
          }

          await refreshData()
        })
        .catch(handleError)
    }

    handleCancel()
  }

  const handleEdit = (id: number): void => {
    const reminder: IReminder | undefined = data.find((reminder: IReminder): boolean => reminder.id === id)
    if (reminder) {
      setIsAdding(true)

      setEditing(reminder)

      form.setValues(reminder)

      if (DEBUG) {
        info(`Editing reminder ID ${id}`)
      }
    }
  }

  const getRows = (): JSX.Element[] => {
    return filteredData.map(
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
            <Tooltip label="Edit" withArrow>
              <ActionIcon
                color="var(--color-og107)"
                data-testid={`testEdit-${row.id}`}
                onClick={(): void => handleEdit(row.id as number)}
                variant="outline">
                <IconPencil color="yellow" size={16} />
              </ActionIcon>
            </Tooltip>
            <Tooltip label="Delete" withArrow>
              <ActionIcon
                color="var(--color-og107)"
                data-testid={`testDelete-${row.id}`}
                ml={10}
                onClick={async (): Promise<void> => showConfirm(row.id as number)}
                variant="outline">
                <IconTrash color="yellow" size={16} />
              </ActionIcon>
            </Tooltip>
          </Table.Td>
        </Table.Tr>
      )
    )
  }

  // biome-ignore lint/correctness/useExhaustiveDependencies: loading from localStorage
  useEffect((): void => {
    const user: string | null = window.localStorage.getItem("mind3rUser")
    if (user) {
      setUser(user.replaceAll('"', "").trim())
    }
  }, [])

  return (
    <>
      <Modal centered onClose={closeLogin} opened={openedLogin} size="auto" withCloseButton={false}>
        <Tooltip label="Name" withArrow>
          <TextInput
            data-testid="testName"
            error={!user}
            label="Name"
            onChange={(e: ChangeEvent<HTMLInputElement>): void => setUser(e.target.value)}
            onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>): void => {
              if (e.key === "Enter") {
                closeLogin()
              }
            }}
            placeholder="Enter name..."
            required
            rightSection={
              <>
                <Tooltip label="Confirm" withArrow>
                  <IconCheck
                    color="green"
                    onClick={(): void => {
                      if (user) {
                        closeLogin()
                      }
                    }}
                    size={16}
                    style={{
                      cursor: "pointer",
                      marginRight: "5px"
                    }}
                  />
                </Tooltip>
                <Tooltip label="Cancel" withArrow>
                  <IconX
                    color="red"
                    onClick={(): void => {
                      if (userValue.current !== user) {
                        resetUser()
                      }
                      closeLogin()
                    }}
                    size={16}
                    style={{
                      cursor: "pointer",
                      marginRight: "5px"
                    }}
                  />
                </Tooltip>
              </>
            }
            value={user}
          />
        </Tooltip>
      </Modal>
      <Group
        style={{
          left: "10px",
          position: "fixed",
          top: "10px"
        }}>
        {!user ? (
          <Tooltip label="Log In" withArrow>
            <Button
              c="var(--mantine-color-dark-0)"
              color="var(--color-og107)"
              data-testid="testLogin"
              leftSection={<IconKey color="yellow" size={16} />}
              onClick={(): void => {
                userValue.current = user
                openLogin()
              }}
              size="xs"
              variant="outline">
              Log In
            </Button>
          </Tooltip>
        ) : (
          <Text c="dimmed" fs="italic" size="xs">
            Logged in as:{" "}
            <Tooltip label="Log Out" withArrow>
              <Anchor c="blue" onClick={resetUser}>
                {user}
              </Anchor>
            </Tooltip>
          </Text>
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
              disabled={!data.length}
              leftSection={<IconSearch color="white" size={16} />}
              onChange={(e: ChangeEvent<HTMLInputElement>): void => filterAndSort(e.currentTarget.value)}
              placeholder="Search by Event or Description..."
              rightSection={
                <Tooltip label="Clear" withArrow>
                  <IconX
                    color="red"
                    onClick={(): void => filterAndSort()}
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
          <Table data-testid="testTable" highlightOnHover mt={20}>
            <Table.Tbody>
              <Table.Tr>
                <Th
                  label="Date/Time"
                  onSort={(): void =>
                    handleSort(SortBy.DATE, sortOrder === SortOrder.ASC ? SortOrder.DESC : SortOrder.ASC)
                  }
                  reversed={sortOrder === SortOrder.ASC}
                  sorted={sortBy === SortBy.DATE}>
                  📅 Date/Time
                </Th>
                <Th
                  label="Event"
                  onSort={(): void =>
                    handleSort(SortBy.EVENT, sortOrder === SortOrder.ASC ? SortOrder.DESC : SortOrder.ASC)
                  }
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
              {filteredData?.length ? (
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
                    {!user ? (
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
                    ) : null}
                  </Table.Td>
                </Table.Tr>
              )}
            </Table.Tbody>
          </Table>
          <Box mt={20} ta="center">
            {isAdding ? (
              <>
                <Tooltip label="Cancel" withArrow>
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
                        label="Date/Time"
                        minDate={dayjs().toISOString()}
                        onChange={(s: string | null): void => form.setFieldValue("date", dayjs(s).toISOString())}
                        timePickerProps={{
                          format: "12h",
                          withDropdown: true,
                          popoverProps: {
                            withinPortal: false
                          }
                        }}
                        value={dayjs(form.values.date).local().format()}
                        valueFormat={DATETIME_FORMAT}
                        w={300}
                        withAsterisk
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
                        withAsterisk
                      />
                      <Textarea
                        {...form.getInputProps("description")}
                        data-testid="testDescription"
                        label="Description"
                        maxLength={MAX_LEN_DESCRIPTION}
                        maxRows={2}
                        minRows={1}
                        ml={20}
                        onChange={(e: ChangeEvent<HTMLTextAreaElement>) =>
                          !e.currentTarget.value.length
                            ? form.setFieldValue("description", null)
                            : form.setFieldValue("description", e.currentTarget.value)
                        }
                        placeholder="Enter description..."
                        value={form.values.description ?? ""}
                        w={300}
                      />
                      <Tooltip label="Submit" withArrow>
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
              <Tooltip label="Add Event" withArrow>
                <Button
                  c="var(--mantine-color-dark-0)"
                  color="var(--color-og107)"
                  data-testid="testAdd"
                  disabled={!user}
                  leftSection={<IconPlus color="green" />}
                  onClick={(): void => setIsAdding(true)}
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
