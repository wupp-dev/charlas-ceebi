<template>
  <a-modal
    v-model:open="showSelectorModal"
    title="Ediciones del CEEBI"
    cancelText="Cancelar"
    okText="Confirmar"
    @ok="selectorHandleOk"
  >
    <p class="mb-2">Puedes cambiar la edición de la cual quieres obtener información.</p>
    <a-select ref="select" v-model:value="currentEdition" :options="editions"></a-select>
  </a-modal>
  <nav class="border-b bg-white">
    <a-drawer v-model:open="showDrawer" title="Menú" placement="right">
      <a-menu
        v-model:selectedKeys="selectedKeys"
        mode="vertical"
        :items="items"
        :style="{ border: 'none' }"
        @click="handleClick"
      />
    </a-drawer>
    <div
      v-if="showCompactMenu"
      class="flex flex-row items-center justify-between w-full px-4 mx-auto"
    >
      <div class="items-center flex-grow">
        <div class="w-fit max-w-[200px] mx-5 pt-2 pb-2">
          <img
            src="@/assets/images/logo-ceebi-horizontal.png"
            alt="CEEBI"
            class="min-w-[200px] max-h-fit"
          />
        </div>
      </div>
      <div class="items-center">
        <a-button @click="showDrawer = true"><IconMenu2 stroke="{2}" class="h-6" /></a-button>
      </div>
    </div>
    <div v-else class="flex items-center justify-between w-full px-4 mx-auto">
      <div class="flex-1 items-center flex-grow">
        <div class="w-fit max-w-[200px] mx-5 pt-2 pb-2">
          <img
            src="@/assets/images/logo-ceebi-horizontal.png"
            alt="CEEBI"
            class="min-w-[200px] max-h-fit"
          />
        </div>
      </div>
      <div class="flex-2 items-center justify-center flex-grow my-2">
        <h1 class="text-2xl font-bold text-center">{{ title }}</h1>
      </div>
      <div class="flex-1 items-center flex-grow text-right">
        <a-dropdown :placement="'bottomRight'">
          <template #overlay>
            <a-menu
              v-model:selectedKeys="selectedKeys"
              mode="vertical"
              :items="items"
              :style="{ border: 'none' }"
              @click="handleClick"
            />
          </template>
          <a-button class="inline-flex items-center" size="large">
            <template #icon>
              <IconMenu2 class="h-4 inline mr-2" />
            </template>
            Menú
          </a-button>
        </a-dropdown>
      </div>
    </div>
  </nav>
</template>

<script setup lang="ts">
import { message, type MenuProps } from 'ant-design-vue'
import { useWindowSize } from '@vueuse/core'
import {
  IconMenu2,
  IconSearch,
  IconCertificate,
  IconHelpHexagon,
  IconSettings,
  IconLogout
} from '@tabler/icons-vue'
import { useRouter } from 'vue-router'
import { useEditionsStore } from '@/stores/editions'
import { useUserStore } from '@/stores/user'
import type { SelectProps } from 'ant-design-vue'

const props = defineProps({
  title: String
})
const router = useRouter()
const userStore = useUserStore()
const editionsStore = useEditionsStore()
const { width, height } = useWindowSize()

const showCompactMenu = computed(() => width.value < 768 || width.value < height.value)
const showDrawer = ref(false)
const showSelectorModal = ref(false)

const selectedKeys = computed(() => {
  return items.value.filter((item) => item.title === props.title).map((item) => item.key)
})

const editions = computed<SelectProps['options']>(() => {
  return editionsStore.editions.map((edition) => {
    return {
      value: edition.id,
      label: `${edition.name} - ${edition.year}`,
      disabled: !edition.selectable
    }
  })
})
const currentEdition = ref('')

const items = ref([
  {
    key: '1',
    icon: () => h(IconSearch, { height: '1rem' }),
    label: 'Ver talleres y microcharlas',
    title: 'Consulta de talleres y microcharlas',
    link: '/consulta',
    style: {
      fontSize: showCompactMenu.value ? '0.875rem' : '1rem',
      display: 'flex',
      alignItems: 'center'
    }
  },
  {
    key: '2',
    icon: () => h(IconCertificate, { height: '1rem' }),
    label: 'Certificados de asistencia',
    title: 'Descarga de certificados de asistencia',
    link: '/certificado',
    style: {
      fontSize: showCompactMenu.value ? '0.875rem' : '1rem',
      display: 'flex',
      alignItems: 'center'
    }
  },
  {
    key: '3',
    icon: () => h(IconHelpHexagon, { height: '1rem' }),
    label: 'Ver y hacer preguntas',
    title: 'Ver y hacer preguntas',
    link: '/pregunta',
    style: {
      fontSize: showCompactMenu.value ? '0.875rem' : '1rem',
      display: 'flex',
      alignItems: 'center'
    }
  },
  {
    key: '4',
    icon: () => h(IconSettings, { height: '1rem' }),
    label: 'Seleccionar otra edición',
    title: 'Seleccionar otra edición',
    onClick: () => {
      showSelectorModal.value = true
    },
    style: {
      fontSize: showCompactMenu.value ? '0.875rem' : '1rem',
      display: 'flex',
      alignItems: 'center'
    }
  }
])

if (userStore.user) {
  items.value.push({
    key: '5',
    icon: () => h(IconLogout, { height: '1rem' }),
    label: 'Cerrar sesión',
    title: 'Cerrar sesión',
    onClick: () => {
      userStore.logout()
      message.success('Sesión cerrada correctamente.')
      items.value.pop()
    },
    style: {
      fontSize: showCompactMenu.value ? '0.875rem' : '1rem',
      display: 'flex',
      alignItems: 'center'
    }
  })
}

const handleClick: MenuProps['onClick'] = (menuInfo) => {
  if (menuInfo.item.link) {
    if (menuInfo.item.link.startsWith('http')) {
      window.open(menuInfo.item.link, '_blank')
    } else {
      router.push(menuInfo.item.link)
    }
  }
}

const selectorHandleOk = () => {
  editionsStore.selected = currentEdition.value
  showSelectorModal.value = false
}

editionsStore.$subscribe(() => {
  currentEdition.value = editionsStore.selected
})

onMounted(() => {
  currentEdition.value = editionsStore.selected
})
</script>
