<script setup lang="ts">
import { MyButton, MyComponent, MyList, MyTitle } from '@workspace/vue';


</script>

<template>
  <main>
   <MyButton>Test</MyButton>
   <MyTitle></MyTitle>
   <MyComponent :first="'Lukas'"></MyComponent>
   <MyList :items="['Test']"></MyList>
  </main>
</template>

<style scoped>
</style>
