import {
  useCallback,
  useId,
  useMemo,
  useState,
  type CSSProperties,
  type PointerEvent,
  type ReactNode,
} from "react";
import "./InfoPanel.css";

export interface InfoPanelController {
  panelId: string;
  isOpen: boolean;
  hasToolbarToggle: boolean;
  showOnMobile: boolean;
  toggle: () => void;
  close: () => void;
}

export interface UseInfoPanelOptions {
  /** Hides the panel's own floating toggle so an `<InfoPanelToggle>` in the toolbar can drive it. */
  hasToolbarToggle?: boolean;
  showOnMobile?: boolean;
}

export function useInfoPanel({
  hasToolbarToggle = false,
  showOnMobile = false,
}: UseInfoPanelOptions = {}): InfoPanelController {
  const panelId = useId();
  const [isOpen, setIsOpen] = useState(false);

  const toggle = useCallback(() => setIsOpen((open) => !open), []);
  const close = useCallback(() => setIsOpen(false), []);

  return useMemo(
    () => ({ panelId, isOpen, hasToolbarToggle, showOnMobile, toggle, close }),
    [panelId, isOpen, hasToolbarToggle, showOnMobile, toggle, close],
  );
}

function MenuIcon({ size }: { size: number }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.25}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <line x1="4" x2="20" y1="6" y2="6" />
      <line x1="4" x2="20" y1="12" y2="12" />
      <line x1="4" x2="20" y1="18" y2="18" />
    </svg>
  );
}

function CloseIcon({ size }: { size: number }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.25}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  );
}

export interface InfoPanelProps {
  /** Pass a controller from `useInfoPanel()` when the panel is driven by an `<InfoPanelToggle>`. */
  panel?: InfoPanelController;
  width?: string;
  bodyPadding?: string;
  contentColumn?: boolean;
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
}

export function InfoPanel({
  panel,
  width,
  bodyPadding,
  contentColumn = false,
  className,
  style,
  children,
}: InfoPanelProps) {
  const fallback = useInfoPanel();
  const controller = panel ?? fallback;

  function stopPointerEvent(event: PointerEvent<HTMLDivElement>) {
    event.stopPropagation();
  }

  const classNames = [
    "info-panel",
    controller.hasToolbarToggle ? "has-toolbar-toggle" : "",
    controller.showOnMobile ? "show-on-mobile" : "",
    controller.isOpen ? "is-open" : "",
    contentColumn ? "info-panel-content-column" : "",
    className ?? "",
  ]
    .filter(Boolean)
    .join(" ");

  const panelStyle: CSSProperties = {
    ...(width ? { ["--demo-info-panel-width" as string]: width } : {}),
    ...(bodyPadding
      ? { ["--demo-info-panel-body-padding" as string]: bodyPadding }
      : {}),
    ...style,
  };

  return (
    <div
      className={classNames}
      style={panelStyle}
      onPointerDown={stopPointerEvent}
      onPointerMove={stopPointerEvent}
      onPointerUp={stopPointerEvent}
      onPointerCancel={stopPointerEvent}
    >
      <button
        className="info-panel-toggle"
        type="button"
        aria-controls={controller.panelId}
        aria-expanded={controller.isOpen}
        aria-label="Toggle info panel"
        onClick={controller.toggle}
      >
        <MenuIcon size={18} />
      </button>
      <section
        className="info-panel-body"
        id={controller.panelId}
        aria-label="Demo information"
      >
        <button
          className="info-panel-close"
          type="button"
          aria-label="Close info panel"
          onClick={controller.close}
        >
          <CloseIcon size={20} />
        </button>
        {children}
      </section>
    </div>
  );
}

export function InfoPanelToggle({ panel }: { panel: InfoPanelController }) {
  return (
    <button
      className={`info-panel-toolbar-toggle${panel.showOnMobile ? " show-on-mobile" : ""}`}
      type="button"
      aria-controls={panel.panelId}
      aria-expanded={panel.isOpen}
      aria-label="Toggle info panel"
      onClick={panel.toggle}
    >
      <MenuIcon size={17} />
    </button>
  );
}
