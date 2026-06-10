import { type CSSProperties } from 'vue'
import type { KritzelBaseObject } from 'kritzel-vue'
import { getEditorRef } from 'kritzel-vue'
import { createSeedObjects } from '../../basic-usage/seed-objects'

export { getEditorRef }

export const accent = '#42b883'
export const accentDark = '#369a6e'

export const hostStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  height: '100%',
  fontFamily: 'Roboto, sans-serif',
}

export const toolbarStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  padding: '8px 12px',
  background: '#f5f5f5',
  borderBottom: '1px solid #ebebeb',
  flexWrap: 'wrap',
}

export const statusBarStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
  padding: '8px 12px',
  background: '#f5f5f5',
  borderTop: '1px solid #ebebeb',
  fontSize: '13px',
}

export const editorStyle: CSSProperties = {
  flex: 1,
  minHeight: 0,
  display: 'block',
}

export function buttonStyle(active = false): CSSProperties {
  return {
    padding: '6px 12px',
    border: `1px solid ${active ? accent : '#d9d9d9'}`,
    borderRadius: '6px',
    background: active ? accent : '#ffffff',
    color: active ? '#ffffff' : '#333333',
    fontSize: '13px',
    cursor: 'pointer',
    fontFamily: 'inherit',
  }
}

export async function seedEditor(editor: {
  addObject: (object: KritzelBaseObject<HTMLElement | SVGElement>) => Promise<unknown>
}) {
  for (const obj of createSeedObjects()) {
    await editor.addObject(obj as KritzelBaseObject<HTMLElement | SVGElement>)
  }
}
