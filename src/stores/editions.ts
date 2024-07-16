import { defineStore } from 'pinia'
import { editions } from './editionsData'

export const useEditionsStore = defineStore('editions', {
  state: () => ({
    editions: editions,
    latest: 'ceebi-iii'
  })
})
