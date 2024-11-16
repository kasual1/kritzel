# Setup

Install the kritzel-vue package.
```
npm i kritzel-vue
```

Import the ComponentLibrary register it as a plugin.
```typescript
import { createApp } from 'vue'
import App from './App.vue'
import { ComponentLibrary } from 'kritzel-vue'

createApp(App).use(ComponentLibrary).mount('#app')

```

Add MyList to your imports to use it in your component template.
```typescript
<script setup lang="ts">
import { MyList } from 'kritzel-vue';
</script>

<template>
  <MyList></MyList>
</template>

<style scoped>
</style>
```
