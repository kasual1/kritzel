<script setup lang="ts">
import { getEditorRef, KritzelEditor } from '@kritzel/vue-editor'
import { vueThemeLight } from '../../const/vue-theme-light'
import { seedEditor } from '../shared/demo-shared';

const editor = getEditorRef('editor');

async function onReady() {
    if (editor.value) {
        await seedEditor(editor.value)
    }
}

</script>

<template>
    <div class="host">
        <KritzelEditor
            ref="editor"
            editorId="quickstart"
            theme="light"
            :themes="[vueThemeLight]"
            :isPanningEnabled="false"
            :isZoomingEnabled="false"
            :isMoreMenuVisible="false"
            :isWorkspaceManagerVisible="false"
            @isReady="onReady"
        />
    </div>
</template>

<style scoped>
.host {
    display: block;
    height: 100%;
}
</style>
