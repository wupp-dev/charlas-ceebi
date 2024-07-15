import { defineStore } from 'pinia'
import type { ShallowRef } from 'vue'
import { MEC } from '@/lib/mec-ts/mec-ts'

export const useMECStore = defineStore('mec', () => {
  const isReady = ref(false)
  const mec: ShallowRef<MEC | null> = shallowRef(null)

  const load = async () => {
    if (isReady.value) return
    mec.value = await MEC.init('https://biociencias.es/wp-json/mecexternal/v1/calendar/10307')

    isReady.value = true
    console.info('[MEC] Loaded', isReady.value, mec.value)
  }

  return { mec, isReady, load }
})
