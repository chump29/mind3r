import { create } from "zustand"

import { type IReminder } from "./IReminder.ts"
import { SortBy, SortOrder } from "./index.ts"

interface IDisplay {
  editing: IReminder | null
  filteredData: IReminder[]
  isAdding: boolean
  search: string
  sortBy: SortBy
  sortOrder: SortOrder
}

const displayStore = create<IDisplay>()(() => ({
  editing: null,
  filteredData: [],
  isAdding: false,
  search: "",
  sortBy: SortBy.DATE,
  sortOrder: SortOrder.ASC
}))

const setEditing = (value: IReminder | null): void =>
  displayStore.setState({
    editing: value
  })

const setFilteredData = (value: IReminder[]): void => {
  displayStore.setState({
    filteredData: value
  })
}

const setIsAdding = (value: boolean): void =>
  displayStore.setState({
    isAdding: value
  })

const setSortOrder = (value: SortOrder): void =>
  displayStore.setState({
    sortOrder: value
  })

const setSearch = (value: string): void =>
  displayStore.setState({
    search: value
  })

const setSortBy = (value: SortBy): void =>
  displayStore.setState({
    sortBy: value
  })

export { displayStore, type IDisplay, setEditing, setFilteredData, setIsAdding, setSearch, setSortBy, setSortOrder }
