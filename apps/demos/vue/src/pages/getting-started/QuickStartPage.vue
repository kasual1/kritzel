<script setup lang="ts">
import { UpdrawEditor, UpdrawWorkspace } from '@updraw/vue-editor'
import { vueThemeLight } from '../../const/vue-theme-light'
import { createSeedObjects } from './seed-objects'

const themes = [vueThemeLight]
const workspaces = [new UpdrawWorkspace({ objects: createSeedObjects() })]
</script>

<template>
    <div class="host">
        <UpdrawEditor
            editorId="quickstart"
            theme="light"
            :themes="themes"
            :workspaces="workspaces"
            :isPanningEnabled="false"
            :isZoomingEnabled="false"
            :isMoreMenuVisible="false"
            :isWorkspaceManagerVisible="false"
        />
    </div>
</template>

<style scoped>
.host {
    display: block;
    height: 100%;
}
</style>
