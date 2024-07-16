import { defineStore } from 'pinia'

export const useEditionStore = defineStore('edition', {
  state: () => ({
    selected: 'ceebi-iii'
  }),
  persist: true
})
