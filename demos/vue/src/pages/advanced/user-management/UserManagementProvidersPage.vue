<script setup lang="ts">
import {
  getEditorRef,
  KritzelEditor,
  KritzelWorkspace,
  type KritzelLoginConfig,
} from '@kritzel/vue-editor'
import { vueThemeDark } from '../../../const/vue-theme-dark'
import { vueThemeLight } from '../../../const/vue-theme-light'
import { createSeedObjects } from '../../getting-started/seed-objects'

const editor = getEditorRef('editor')

const providerIcons: Record<string, string> = {
  'auth-google': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 12h5a5 5 0 1 1-1.6-3.6"/></svg>',
  'auth-github': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18-6-6 6-6"/><path d="m15 6 6 6-6 6"/></svg>',
  'auth-microsoft': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="8" height="8"/><rect x="13" y="3" width="8" height="8"/><rect x="3" y="13" width="8" height="8"/><rect x="13" y="13" width="8" height="8"/></svg>',
  'auth-email': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></svg>',
}

const themes = [vueThemeLight, vueThemeDark]
const workspaces = [new KritzelWorkspace({ objects: createSeedObjects() })]
const loginConfig: KritzelLoginConfig = {
  title: 'Sign in to Kritzel',
  providers: [
    { name: 'google', icon: 'google', label: 'Continue with Google' },
    { name: 'facebook', icon: 'facebook', label: 'Continue with Facebook' },
    { name: 'github', icon: 'github', label: 'Continue with GitHub' },
  ],
}

async function onReady(): Promise<void> {
  await editor.value?.openLoginDialog()
}
</script>

<template>
  <KritzelEditor
    ref="editor"
    editorId="user-management-providers"
    :loginConfig="loginConfig"
    :customSvgIcons="providerIcons"
    :workspaces="workspaces"
    theme="light"
    :themes="themes"
    :isPanningEnabled="false"
    :isZoomingEnabled="false"
    :isMoreMenuVisible="false"
    :isWorkspaceManagerVisible="false"
    @isReady="onReady"
    style="display: block; width: 100%; height: 100vh"
  />
</template>
