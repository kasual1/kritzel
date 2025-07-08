<script setup lang="ts">
import { KritzelEditor, KritzelText } from 'kritzel-vue'
import { useTemplateRef, onMounted } from 'vue';

const editor = useTemplateRef('editor');

onMounted(async () => {
  debugger;
  await customElements.whenDefined('kritzel-editor');

  const text = new KritzelText({
    value: 'Hello Kritzel!',
    translateX: 0,
    translateY: 0,
    fontSize: 24,
    fontFamily: 'Arial',
    fontColor: '#000000',
    height: 200,
    width: 200,
  });

  setTimeout(async () => {
    await editor.value?.$el.addObject(text);
    editor.value?.$el.selectObjects([text]);
  }, 1000);


});

async function getSelectedObjects() {
  const selectedObjects = await editor.value?.$el.getSelectedObjects();
  console.log('Selected objects:', selectedObjects);
}

</script>

<template>
  <main>
    <div style="display: flex; gap: 10px; position: absolute; top: 0; left: 0; z-index: 100;">
      <button @click="getSelectedObjects">Get selected objects</button>
    </div>

    <KritzelEditor ref="editor" />
  </main>
</template>

<style scoped></style>
