# Setup

Install the kritzel-vue package.
```
npm i kritzel-vue
```

Import the ComponentLibrary and register it as a plugin.
```typescript
import { createApp } from 'vue'
import App from './App.vue'
import { ComponentLibrary } from 'kritzel-vue'

createApp(App).use(ComponentLibrary).mount('#app')

```

Import Kritzel components to use them in your template.
```html
<script setup lang="ts">
import { KritzelEngine, KritzelControls } from 'kritzel-vue';
</script>

<template>
  <KritzelEngine></KritzelEngine>
  <KritzelControls></KritzelControls>
</template>

<style scoped>
</style>
```
