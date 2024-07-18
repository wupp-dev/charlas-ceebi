import { defineStore } from 'pinia'
import { editions } from './editionsData'

export const useEditionsStore = defineStore('editions', {
  state: () => ({
    editions: editions,
    selected: 'ceebi-iii',
    latest: 'ceebi-iii'
  }),
  persist: {
    paths: ['selected']
  }
})
