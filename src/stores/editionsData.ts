type Edition = {
  id: string
  name: string
  year: number
  selectable: boolean
}

export const editions: Edition[] = [
  { id: 'ceebi-i', name: 'I CEEBI', year: 2022, selectable: false },
  { id: 'ceebi-ii', name: 'II CEEBI', year: 2023, selectable: true },
  { id: 'ceebi-iii', name: 'III CEEBI', year: 2024, selectable: true }
]
