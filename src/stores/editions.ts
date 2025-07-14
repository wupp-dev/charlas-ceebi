import { defineStore } from 'pinia'
import { editions } from './editionsData'

export const useEditionsStore = defineStore('editions', {
  state: () => ({
    editions: editions,
    selected: 'ceebi-iv',
    latest: 'ceebi-iv'
  }),
  persist: {
    paths: ['selected']
  }
})
