<script setup lang="ts">
import {
  KritzelEditor,
  KritzelWorkspace,
  type IKritzelUser,
} from '@kritzel/vue-editor'
import { vueThemeDark } from '../../../const/vue-theme-dark'
import { vueThemeLight } from '../../../const/vue-theme-light'
import { createSeedObjects } from '../../getting-started/seed-objects'

const themes = [vueThemeLight, vueThemeDark]
const workspaces = [new KritzelWorkspace({ objects: createSeedObjects() })]
const user: IKritzelUser = {
  id: 'user-current-1',
  displayName: 'Ada Lovelace',
  email: 'ada@example.com',
  oauthProvider: 'demo',
  color: '#42b883',
  isGuest: false,
}
const activeUsers: IKritzelUser[] = [
  {
    id: 'user-collaborator-1',
    displayName: 'Grace Hopper',
    email: 'grace@example.com',
    oauthProvider: 'demo',
    color: '#0f766e',
    isGuest: false,
  },
  {
    id: 'user-collaborator-2',
    displayName: 'Katherine Johnson',
    email: 'katherine@example.com',
    oauthProvider: 'demo',
    color: '#7c3aed',
    isGuest: false,
  },
  {
    id: 'user-collaborator-3',
    displayName: 'Margaret Hamilton',
    email: 'margaret@example.com',
    oauthProvider: 'demo',
    color: '#ea580c',
    isGuest: false,
  },
]
</script>

<template>
  <KritzelEditor
    editorId="user-management-users"
    :user="user"
    :activeUsers="activeUsers"
    :workspaces="workspaces"
    theme="light"
    :themes="themes"
    :isPanningEnabled="false"
    :isZoomingEnabled="false"
    :isMoreMenuVisible="false"
    :isWorkspaceManagerVisible="false"
    style="display: block; width: 100%; height: 100vh"
  />
</template>