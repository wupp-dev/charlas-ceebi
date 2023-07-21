import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      redirect: '/certificado',
    },
    {
      path: '/consulta',
      component: () => import('@/views/QuerysView.vue'),
    },
    {
      path: '/certificado',
      component: () => import('@/views/CertView.vue'),
    },
  ]
})

export default router
