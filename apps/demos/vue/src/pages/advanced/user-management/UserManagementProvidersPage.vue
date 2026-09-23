<script setup lang="ts">
import { getEditorRef, KritzelEditor } from '@kritzel/vue-editor'
import { vueThemeLight } from '../../../const/vue-theme-light'

const editor = getEditorRef('editor')

const providerIcons: Record<string, string> = {
  'auth-google': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 12h5a5 5 0 1 1-1.6-3.6"/></svg>',
  'auth-github': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18-6-6 6-6"/><path d="m15 6 6 6-6 6"/></svg>',
  'auth-microsoft': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="8" height="8"/><rect x="13" y="3" width="8" height="8"/><rect x="3" y="13" width="8" height="8"/><rect x="13" y="13" width="8" height="8"/></svg>',
  'auth-email': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></svg>',
}

const loginConfig = {
  title: 'Sign in to Kritzel',
  subtitle: 'Choose a provider to continue to your workspace.',
  providers: [
    { name: 'google', label: 'Continue with Google', icon: 'auth-google' },
    { name: 'github', label: 'Continue with GitHub', icon: 'auth-github' },
    { name: 'microsoft', label: 'Continue with Microsoft', icon: 'auth-microsoft' },
    { name: 'email', label: 'Continue with Email', icon: 'auth-email' },
  ],
}
</script>

<template>
  <div class="page">
    <div class="toolbar"><strong>Login Providers:</strong> each entry in loginConfig.providers becomes a button in the dialog.</div>
    <KritzelEditor ref="editor" editorId="user-management-providers" :loginConfig="loginConfig" :customSvgIcons="providerIcons" theme="light" :themes="[vueThemeLight]" :isPanningEnabled="false" :isZoomingEnabled="false" :isMoreMenuVisible="false" :isWorkspaceManagerVisible="false" @isReady="() => editor?.openLoginDialog()" />
  </div>
</template>

<style scoped>
.page { display: flex; flex-direction: column; height: 100vh; }
.toolbar { padding: 8px 12px; background: #f5f5f5; border-bottom: 1px solid #ebebeb; font: 13px sans-serif; }
.toolbar strong { color: #42b883; }
KritzelEditor { flex: 1; min-height: 0; }
</style>
