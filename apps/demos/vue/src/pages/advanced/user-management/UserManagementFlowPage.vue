<script setup lang="ts">
import { ref } from 'vue'
import { getEditorRef, KritzelEditor, type IKritzelUser } from '@kritzel/vue-editor'
import { vueThemeLight } from '../../../const/vue-theme-light'

const editor = getEditorRef('editor')

const user = ref<IKritzelUser | undefined>(undefined)
const status = ref('Signed out')

const demoAccounts: Record<string, IKritzelUser> = {
  google: { id: 'user-google-1', displayName: 'Ada Lovelace', email: 'ada@example.com', oauthProvider: 'google', color: '#42b883', isGuest: false },
  github: { id: 'user-github-1', displayName: 'Alan Turing', email: 'alan@example.com', oauthProvider: 'github', color: '#1f2937', isGuest: false },
}

const loginConfig = {
  title: 'Sign in',
  subtitle: 'Authentication is handled by your application.',
  providers: [
    { name: 'google', label: 'Continue with Google' },
    { name: 'github', label: 'Continue with GitHub' },
  ],
}

function authenticate(provider: string): Promise<IKritzelUser> {
  return new Promise(resolve => setTimeout(() => resolve(demoAccounts[provider] ?? demoAccounts.google), 800))
}

async function onLogin(event: CustomEvent<{ provider: string }>) {
  const provider = event.detail.provider
  status.value = `Authenticating with ${provider}...`
  // The dialog stays in its loading state until the app resolves authentication.
  await editor.value?.setLoginLoading(provider)
  const account = await authenticate(provider)
  await editor.value?.setLoginLoading(null)
  user.value = account
  status.value = `Signed in as ${account.displayName}`
}

function onLogout() {
  user.value = undefined
  status.value = 'Signed out'
}
</script>

<template>
  <div class="page">
    <div class="toolbar">
      <strong>Login Flow:</strong>
      <span>Status: {{ status }}</span>
      <button @click="editor?.openLoginDialog()">Open login dialog</button>
    </div>
    <KritzelEditor ref="editor" editorId="user-management-flow" :loginConfig="loginConfig" :user="user" theme="light" :themes="[vueThemeLight]" :isPanningEnabled="false" :isZoomingEnabled="false" :isMoreMenuVisible="false" :isWorkspaceManagerVisible="false" @login="onLogin" @logout="onLogout" />
  </div>
</template>

<style scoped>
.page { display: flex; flex-direction: column; height: 100vh; }
.toolbar { display: flex; align-items: center; gap: 8px; padding: 8px 12px; background: #f5f5f5; border-bottom: 1px solid #ebebeb; font: 13px sans-serif; }
.toolbar strong { color: #42b883; }
.toolbar button { margin-left: auto; }
KritzelEditor { flex: 1; min-height: 0; }
</style>
