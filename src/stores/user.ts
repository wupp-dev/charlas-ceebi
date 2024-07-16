import { defineStore } from 'pinia'
import ky from 'ky'
import { HTTPError } from 'ky'
import type { WPUser } from '@/lib/wp-types'

export interface WPJWTResponse {
  token: string
  user_display_name: string
  user_email: string
  user_nickname: string
}

const wpapi = ky.create({
  prefixUrl: 'https://biociencias.es/wp-json'
})

export const useUserStore = defineStore('user', {
  state: () => ({
    wpToken: null as string | null,
    user: null as WPUser | null
  }),
  actions: {
    async login(username: string, password: string) {
      let res
      try {
        res = await wpapi
          .post('jwt-auth/v1/token', {
            json: {
              username,
              password
            }
          })
          .json<WPJWTResponse>()
      } catch (e) {
        if ((e as HTTPError).response) {
          const errorResponse = await (e as HTTPError).response.json()
          const errorCode: string = errorResponse.code
          throw new Error(errorCode)
        } else {
          throw new Error('error when fetching token from wp')
        }
      }

      const authHeaders = (actual: Record<string, string>) => ({
        Authorization: 'Bearer ' + this.wpToken,
        ...actual
      })

      this.user = await wpapi
        .get(`wp/v2/users/me?context=edit`, {
          headers: authHeaders({})
        })
        .json<WPUser>()
    },
    logout() {
      this.wpToken = null
      this.user = null
    }
  },
  persist: true
})
