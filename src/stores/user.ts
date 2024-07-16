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
        console.log(res)
        console.error('error when fetching token from wp')
        console.log('error', e)
        // @ts-ignore
        console.log('error', e.code)
        // @ts-ignore response has a code
        console.log('error code', e.response)
        throw e as HTTPError
      }
      console.log(res)
      this.wpToken = res.token

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
