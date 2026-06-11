<script setup lang="ts">
import { ref } from 'vue'
import {
  getEditorRef,
  KritzelEditor,
  KritzelShape,
  KritzelText,
  ShapeType,
} from 'kritzel-vue'
import { customVueTheme } from '../../../const/custom-vue-theme'

interface Slide {
  title: string
  centerX: number
  centerY: number
}

const editor = getEditorRef('editor')

const slides: Slide[] = [
  { title: '1. Welcome to Kritzel', centerX: 0, centerY: 0 },
  { title: '2. Core Frontend Capabilities', centerX: 1200, centerY: 0 },
  { title: '3. Seamless Presentation Layout', centerX: 2400, centerY: 0 },
]

const currentSlideIndex = ref(0)

async function onReady() {
  if (!editor.value) {
    return
  }

  const existing = await editor.value.getAllObjects()
  if (existing.length === 0) {
    await seedSlides()
  }
  await navigateToSlide(0)
}

async function seedSlides() {
  if (!editor.value) {
    return
  }

  // Slide 1 background frame and content
  await editor.value.addObject(
    new KritzelShape({
      translateX: -400,
      translateY: -225,
      width: 800,
      height: 450,
      shapeType: ShapeType.Rectangle,
      fillColor: { light: '#ffffff', dark: '#1b1b1e' },
      strokeColor: { light: '#42b883', dark: '#369a6e' },
      strokeWidth: 4,
    }),
  )

  await editor.value.addObject(
    new KritzelText({
      text: 'Welcome to Kritzel',
      translateX: -350,
      translateY: -150,
      fontSize: 36,
      fontColor: { light: '#42b883', dark: '#7ee2b8' },
    }),
  )

  await editor.value.addObject(
    new KritzelText({
      text: 'A modern vector drawing component for web builders. This workspace demonstrates Slideshow Mode, spacing slide sheets on a virtual horizontal track.\n\nUse the presentation controls above to glide smoothly between slides!',
      translateX: -350,
      translateY: -50,
      fontSize: 20,
      fontColor: { light: '#333333', dark: '#eeeeee' },
    }),
  )

  // Decorative shape slide 1
  await editor.value.addObject(
    new KritzelShape({
      translateX: 200,
      translateY: 50,
      width: 120,
      height: 120,
      shapeType: ShapeType.Ellipse,
      fillColor: { light: '#e3f2fd', dark: '#1a237e' },
      strokeColor: { light: '#1565c0', dark: '#90caf9' },
      strokeWidth: 2,
    }),
  )

  // Slide 2 background frame and content
  await editor.value.addObject(
    new KritzelShape({
      translateX: 800,
      translateY: -225,
      width: 800,
      height: 450,
      shapeType: ShapeType.Rectangle,
      fillColor: { light: '#ffffff', dark: '#1b1b1e' },
      strokeColor: { light: '#42b883', dark: '#369a6e' },
      strokeWidth: 4,
    }),
  )

  await editor.value.addObject(
    new KritzelText({
      text: 'Core Frontend Power',
      translateX: 850,
      translateY: -150,
      fontSize: 36,
      fontColor: { light: '#42b883', dark: '#7ee2b8' },
    }),
  )

  await editor.value.addObject(
    new KritzelText({
      text: '• Offline-First Canvas Persistence\n• Dynamic Viewport & Navigation Helpers\n• Tailored Custom Color Tool Palettes\n• Entirely Interactive Drawing Tools',
      translateX: 850,
      translateY: -50,
      fontSize: 20,
      fontColor: { light: '#333333', dark: '#eeeeee' },
    }),
  )

  // Decorative shape slide 2
  await editor.value.addObject(
    new KritzelShape({
      translateX: 1400,
      translateY: 50,
      width: 120,
      height: 100,
      shapeType: ShapeType.Triangle,
      fillColor: { light: '#fce4ec', dark: '#880e4f' },
      strokeColor: { light: '#c62828', dark: '#ef9a9a' },
      strokeWidth: 2,
    }),
  )

  // Slide 3 background frame and content
  await editor.value.addObject(
    new KritzelShape({
      translateX: 2000,
      translateY: -225,
      width: 800,
      height: 450,
      shapeType: ShapeType.Rectangle,
      fillColor: { light: '#ffffff', dark: '#1b1b1e' },
      strokeColor: { light: '#42b883', dark: '#369a6e' },
      strokeWidth: 4,
    }),
  )

  await editor.value.addObject(
    new KritzelText({
      text: 'Seamless Bounded Layouts',
      translateX: 2050,
      translateY: -150,
      fontSize: 36,
      fontColor: { light: '#42b883', dark: '#7ee2b8' },
    }),
  )

  await editor.value.addObject(
    new KritzelText({
      text: 'By setting finite limits on the viewport bounds, the user can draw and interact inside the slide card, but cannot pan away to empty space.\n\nCombined with pan animation flows, this makes a wonderful presentation experience.',
      translateX: 2050,
      translateY: -50,
      fontSize: 20,
      fontColor: { light: '#333333', dark: '#eeeeee' },
    }),
  )

  // Decorative shape slide 3
  await editor.value.addObject(
    new KritzelShape({
      translateX: 2600,
      translateY: 50,
      width: 100,
      height: 100,
      shapeType: ShapeType.Rectangle,
      fillColor: { light: '#e8f5e9', dark: '#1b5e20' },
      strokeColor: { light: '#2e7d32', dark: '#a5d6a7' },
      strokeWidth: 2,
    }),
  )
}

async function goToPrevSlide() {
  if (currentSlideIndex.value > 0) {
    const targetIndex = currentSlideIndex.value - 1
    currentSlideIndex.value = targetIndex
    await navigateToSlide(targetIndex)
  }
}

async function goToNextSlide() {
  if (currentSlideIndex.value < slides.length - 1) {
    const targetIndex = currentSlideIndex.value + 1
    currentSlideIndex.value = targetIndex
    await navigateToSlide(targetIndex)
  }
}

async function navigateToSlide(index: number) {
  const slide = slides[index]
  if (!slide) {
    return
  }
  // Smoothly pan the viewport to the target center coordinates.
  await editor.value?.setViewport(slide.centerX, slide.centerY, 1)
}
</script>

<template>
  <div class="presentation-page">
    <header class="presentation-header">
      <div class="brand">
        <span class="badge">Presentation Mode</span>
        <h1 class="title">Interactive Slideshow</h1>
      </div>

      <div class="controls-group">
        <div class="nav-buttons">
          <button
            class="nav-btn"
            :disabled="currentSlideIndex === 0"
            @click="goToPrevSlide"
          >
            Previous
          </button>
          <span class="slide-indicator">
            Slide <strong>{{ currentSlideIndex + 1 }}</strong> of
            {{ slides.length }}
          </span>
          <button
            class="nav-btn"
            :disabled="currentSlideIndex === slides.length - 1"
            @click="goToNextSlide"
          >
            Next
          </button>
        </div>
      </div>
    </header>

    <div class="editor-container">
      <KritzelEditor
        ref="editor"
        editorId="slideshow-presentation"
        theme="vue-theme"
        :themes="[customVueTheme]"
        :wheelEnabled="false"
        :isControlsVisible="false"
        :isMoreMenuVisible="false"
        :isWorkspaceManagerVisible="false"
        :loginConfig="undefined"
        :style="{ display: 'block', width: '100%', height: '100%' }"
        @isReady="onReady"
      />
    </div>
  </div>
</template>

<style scoped>
.presentation-page {
  display: flex;
  flex-direction: column;
  height: 100%;
  font-family: Inter, Segoe UI, sans-serif;
  background:
    linear-gradient(180deg, rgba(244, 251, 247, 1) 0%, rgba(233, 246, 239, 1) 100%);
}

.presentation-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 24px;
  background: #ffffff;
  border-bottom: 1px solid #d4ece0;
  box-shadow: 0 1px 3px rgba(66, 184, 131, 0.06);
}

.brand {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.badge {
  align-self: flex-start;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  background-color: rgba(66, 184, 131, 0.1);
  color: #42b883;
  padding: 2px 8px;
  border-radius: 99px;
  letter-spacing: 0.5px;
}

.title {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  color: #214f3d;
}

.controls-group {
  display: flex;
  align-items: center;
  gap: 24px;
}

.nav-buttons {
  display: flex;
  align-items: center;
  gap: 12px;
  background: rgba(66, 184, 131, 0.08);
  padding: 4px;
  border-radius: 8px;
}

.nav-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 16px;
  border: 1px solid #c9e6d8;
  border-radius: 6px;
  background: #ffffff;
  cursor: pointer;
  font-size: 13px;
  font-weight: 500;
  color: #42b883;
  box-shadow: 0 1px 2px rgba(66, 184, 131, 0.08);
  transition: all 0.2s ease;
}

.nav-btn:hover:not(:disabled) {
  background: #42b883;
  color: #ffffff;
}

.nav-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  box-shadow: none;
}

.slide-indicator {
  font-size: 13px;
  color: #587467;
  min-width: 90px;
  text-align: center;
}

.editor-container {
  flex: 1;
  position: relative;
  min-height: 0;
}
</style>
