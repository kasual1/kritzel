import {
  computed,
  useTemplateRef,
  type ComponentPublicInstance,
} from "vue";

/**
 * Resolves the native Kritzel editor element from a specific Vue template ref.
 *
 * Because `<KritzelEditor>` is a Vue component (not a raw custom element),
 * a template ref points to the component instance rather than the DOM element.
 * Pass the same ref that is bound in your template to make sure the resolved
 * editor always belongs to that exact component instance.
 *
 * @example
 * ```vue
 * <script setup lang="ts">
 * import { KritzelEditor, getEditorRef } from '@kritzel/vue-editor'
 * import { ref, type ComponentPublicInstance } from 'vue'
 *
 * const editorComponent = ref<ComponentPublicInstance | null>(null)
 * const editor = getEditorRef(editorComponent)
 *
 * async function onReady() {
 *   await editor.value?.addObject(...)
 * }
 * </script>
 *
 * <template>
 *   <KritzelEditor ref="editor" @isReady="onReady" />
 * </template>
 * ```
 */
export function getEditorRef(componentRef: string) {
  const editorComponent = useTemplateRef<ComponentPublicInstance>(componentRef);
  return computed(() => {
    const value = editorComponent.value;
    if (!value) {
      return null;
    }

    return "$el" in value
      ? ((value.$el as HTMLKritzelEditorElement | undefined) ?? null)
      : value;
  });
}

/**
 * Resolves the native Kritzel engine element from a specific Vue template ref.
 *
 * Because `<KritzelEngine>` is a Vue component (not a raw custom element),
 * a template ref points to the component instance rather than the DOM element.
 * Pass the same ref that is bound in your template to make sure the resolved
 * engine always belongs to that exact component instance.
 */
export function getEngineRef(componentRef: string) {
  const engineComponent = useTemplateRef<ComponentPublicInstance>(componentRef);
  return computed(() => {
    const value = engineComponent.value;
    if (!value) {
      return null;
    }

    return "$el" in value
      ? ((value.$el as HTMLKritzelEngineElement | undefined) ?? null)
      : value;
  });
}
