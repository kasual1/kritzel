<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { RouterLink } from 'vue-router'
import { demoCategories, demoRoutes, type DemoCategory } from '../demo-routes'

const query = ref('')
const visibleRoutes = demoRoutes.filter((route) => !route.hidden)
const collapsedCategories = ref<Set<DemoCategory['id']>>(
  new Set(demoCategories.map((category) => category.id)),
)

const filteredCategories = computed(() => {
  const terms = query.value.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean)

  return demoCategories
    .map((category) => ({
      ...category,
      routes: visibleRoutes.filter((route) => {
        if (route.category !== category.id) return false
        if (terms.length === 0) return true

        const searchableText = `${category.title} ${route.title} ${route.context ?? ''} ${route.path}`.toLocaleLowerCase()
        return terms.every((term) => searchableText.includes(term))
      }),
    }))
    .filter((category) => category.routes.length > 0)
})

const visibleDemoCount = computed(() =>
  filteredCategories.value.reduce((count, category) => count + category.routes.length, 0),
)

watch(query, (value) => {
  if (!value.trim()) {
    collapsedCategories.value = new Set(demoCategories.map((category) => category.id))
    return
  }

  const matchingCategories = new Set(filteredCategories.value.map((category) => category.id))
  collapsedCategories.value = new Set(
    [...collapsedCategories.value].filter((category) => !matchingCategories.has(category)),
  )
})

function isCollapsed(category: DemoCategory['id']): boolean {
  return collapsedCategories.value.has(category)
}

function toggleCategory(category: DemoCategory['id']): void {
  const updatedCategories = new Set(collapsedCategories.value)
  if (updatedCategories.has(category)) {
    updatedCategories.delete(category)
  } else {
    updatedCategories.add(category)
  }
  collapsedCategories.value = updatedCategories
}
</script>

<template>
  <div class="demo-index">
    <header>
      <h1>Demo directory</h1>
      <p class="summary" aria-live="polite">
        {{ visibleDemoCount }} of {{ visibleRoutes.length }} routes
      </p>
      <label for="demo-search">Search demos</label>
      <input
        id="demo-search"
        v-model="query"
        type="search"
        placeholder="Search by name, category, or path"
        autocomplete="off"
      />
    </header>

    <main>
      <section v-for="category in filteredCategories" :key="category.id">
        <h2>
          <button
            type="button"
            :aria-expanded="!isCollapsed(category.id)"
            :aria-controls="`${category.id}-demos`"
            @click="toggleCategory(category.id)"
          >
            <span class="chevron" :class="{ collapsed: isCollapsed(category.id) }" aria-hidden="true" />
            <span>{{ category.title }}</span>
            <span class="category-count">{{ category.routes.length }}</span>
          </button>
        </h2>
        <nav
          :id="`${category.id}-demos`"
          :aria-label="`${category.title} demos`"
          :hidden="isCollapsed(category.id)"
        >
          <RouterLink v-for="route in category.routes" :key="route.path" :to="route.path">
            <span class="link-copy">
              <strong>{{ route.title }}</strong>
              <small v-if="route.context">{{ route.context }}</small>
            </span>
          </RouterLink>
        </nav>
      </section>

      <p v-if="filteredCategories.length === 0" class="empty-state">
        No demos match "{{ query }}".
      </p>
    </main>
  </div>
</template>

<style scoped>
.demo-index {
  min-height: 100dvh;
  box-sizing: border-box;
  overflow-y: auto;
  color: #202124;
  background: #ffffff;
  font-family: Avenir, Montserrat, Corbel, sans-serif;
}

header {
  max-width: 800px;
  margin: 0 auto;
  padding: 32px 24px 24px;
  box-sizing: border-box;
  border-bottom: 1px solid #e5e5e5;
}

h1 {
  margin: 0;
  font-size: 28px;
  line-height: 1.2;
  letter-spacing: 0;
}

.summary {
  margin: 6px 0 0;
  color: #666666;
  font-size: 14px;
}

label {
  display: block;
  margin-top: 24px;
  margin-bottom: 6px;
  font-size: 13px;
  font-weight: 600;
}

input {
  width: min(100%, 560px);
  height: 40px;
  padding: 0 12px;
  box-sizing: border-box;
  color: inherit;
  background: #ffffff;
  border: 1px solid #b8b8b8;
  border-radius: 4px;
  font: inherit;
  font-size: 14px;
}

input:focus {
  border-color: #087f5b;
  outline: 2px solid rgb(8 127 91 / 18%);
}

main {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 12px;
  max-width: 800px;
  margin: 0 auto;
  padding: 32px 24px 64px;
  box-sizing: border-box;
}

section {
  min-width: 0;
}

h2 {
  margin: 0;
  letter-spacing: 0;
  border-bottom: 1px solid #cfcfcf;
}

h2 button {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 8px 4px;
  color: inherit;
  background: transparent;
  border: 0;
  cursor: pointer;
  font: inherit;
  font-size: 16px;
  font-weight: 650;
  text-align: left;
}

h2 button:hover,
h2 button:focus-visible,
a:hover,
a:focus-visible {
  color: #087f5b;
  background: #f6faf8;
  outline: none;
}

h2 button:focus-visible,
a:focus-visible {
  box-shadow: inset 3px 0 #0ca678;
}

.chevron {
  width: 8px;
  height: 8px;
  border-right: 2px solid currentColor;
  border-bottom: 2px solid currentColor;
  transform: rotate(45deg);
  transition: transform 120ms ease;
}

.chevron.collapsed {
  transform: rotate(-45deg);
}

.category-count {
  margin-left: auto;
  color: #666666;
  font-size: 13px;
  font-weight: 400;
  font-variant-numeric: tabular-nums;
}

nav {
  display: grid;
}

nav[hidden] {
  display: none;
}

a {
  display: flex;
  align-items: center;
  min-height: 48px;
  padding: 8px 4px;
  box-sizing: border-box;
  color: inherit;
  text-decoration: none;
  border-bottom: 1px solid #eeeeee;
}

.link-copy {
  display: grid;
  gap: 4px;
  min-width: 0;
}

strong {
  overflow-wrap: anywhere;
  font-size: 14px;
  font-weight: 600;
}

small {
  color: #666666;
  font-size: 12px;
}

.empty-state {
  margin: 0;
  color: #666666;
  font-size: 14px;
}

@media (max-width: 600px) {
  header {
    padding-top: 24px;
  }

  main {
    padding-top: 24px;
  }
}
</style>