import { reactive } from 'vue'

let nextInfoPanelId = 0

export interface InfoPanelController {
  panelId: string
  isOpen: boolean
  hasToolbarToggle: boolean
  showOnMobile: boolean
  toggle: () => void
  close: () => void
}

export interface UseInfoPanelOptions {
  /** Hides the panel's own floating toggle so an `<InfoPanelToggle>` in the toolbar can drive it. */
  hasToolbarToggle?: boolean
  showOnMobile?: boolean
}

export function useInfoPanel({
  hasToolbarToggle = false,
  showOnMobile = false,
}: UseInfoPanelOptions = {}): InfoPanelController {
  const controller = reactive<InfoPanelController>({
    panelId: `demo-info-panel-${nextInfoPanelId++}`,
    isOpen: false,
    hasToolbarToggle,
    showOnMobile,
    toggle: () => {
      controller.isOpen = !controller.isOpen
    },
    close: () => {
      controller.isOpen = false
    },
  })

  return controller
}
