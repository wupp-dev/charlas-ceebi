import { createApp } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'
import { routes } from 'vue-router/auto-routes'
import { createPinia } from 'pinia'
import { autoAnimatePlugin } from '@formkit/auto-animate/vue'
import App from './App.vue'
import './assets/main.css'

const app = createApp(App)
const router = createRouter({
  history: createWebHistory(),
  routes
})
const pinia = createPinia()

app.use(router)
app.use(pinia)
app.use(autoAnimatePlugin)

app.mount('#app')
