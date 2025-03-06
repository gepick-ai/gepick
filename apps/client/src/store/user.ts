import { defineStore } from 'pinia';
import { User } from '@gepick/user/common';
import { getUser } from '@gepick/user/browser';

export const userStore = defineStore('user', {
  state: (): User => ({
    id: '',
    name: '',
    avatarUrl: '',
    chatLimit: 0,
    chatUsed: 0,
    omikujiLimit: 0,
    omikujiUsed: 0,
    wallpaperLimit: 0,
    wallpaperUsed: 0,
  }),
  actions: {
    setUserInfo(user: User) {
      this.id = user.id
      this.name = user.name
      this.avatarUrl = user.avatarUrl
      this.chatLimit = user.chatLimit
      this.chatUsed = user.chatUsed
      this.omikujiLimit = user.omikujiLimit
      this.omikujiUsed = user.omikujiUsed
      this.wallpaperLimit = user.wallpaperLimit
      this.wallpaperUsed = user.wallpaperUsed
    },
    async refreshUserInfo() {
      const { user } = await getUser();
      this.setUserInfo(user)
    },
  },
})
