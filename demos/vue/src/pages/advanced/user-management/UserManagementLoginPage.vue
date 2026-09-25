<script setup lang="ts">
import { ref } from 'vue'
import {
  getEditorRef,
  KritzelEditor,
  KritzelWorkspace,
  type IKritzelUser,
  type KritzelLoginConfig,
  type LoginEvent,
} from '@kritzel/vue-editor'
import { vueThemeDark } from '../../../const/vue-theme-dark'
import { vueThemeLight } from '../../../const/vue-theme-light'
import { createSeedObjects } from '../../getting-started/seed-objects'

const editor = getEditorRef('editor')
const themes = [vueThemeLight, vueThemeDark]
const workspaces = [new KritzelWorkspace({ objects: createSeedObjects() })]
const user = ref<IKritzelUser>()
const loginConfig: KritzelLoginConfig = {
  title: 'Sign in',
  providers: [
    { name: 'google', icon: 'google', label: 'Continue with Google' },
    { name: 'facebook', icon: 'facebook', label: 'Continue with Facebook' },
    { name: 'github', icon: 'github', label: 'Continue with GitHub' },
  ],
}

async function onReady(): Promise<void> {
  await editor.value?.openLoginDialog()
}

async function onLogin(event: CustomEvent<LoginEvent>): Promise<void> {
  const provider = event.detail.provider
  user.value = {
    id: `user-${provider}-1`,
    displayName: 'Ada Lovelace',
    color: '#42b883',
    isGuest: false,
  }
  await editor.value?.closeLoginDialog()
}

function onLogout(): void {
  user.value = undefined
}
</script>

<template>
  <KritzelEditor
    ref="editor"
    editorId="user-management-login"
    :loginConfig="loginConfig"
    :user="user"
    :workspaces="workspaces"
    theme="light"
    :themes="themes"
    :isPanningEnabled="false"
    :isZoomingEnabled="false"
    :isMoreMenuVisible="false"
    :isWorkspaceManagerVisible="false"
    @isReady="onReady"
    @login="onLogin"
    @logout="onLogout"
    style="display: block; width: 100%; height: 100vh"
  />
</template>