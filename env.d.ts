/// <reference types="vite/client" />


// Así deja de dar error en el import de vue en el main.ts
declare module '*.vue' {
  import { DefineComponent } from 'vue'
  const component: DefineComponent<{}, {}, any>
  export default component
}