import { useEffect, useRef, useState, type ReactNode } from "react";
import Link from "@docusaurus/Link";
import useBaseUrl from "@docusaurus/useBaseUrl";
import Icon, { GitHubIcon } from "./Icon";
import { CallToActionBar } from "./Sections";
import Calculator from "./Calculator";
import HeroTitle from "./HeroTitle";
import { KRITZEL_LOGO_PATH } from "./paths";
import styles from "./styles.module.css";

function DraggableCanvasItem({
  children,
  className,
  label,
  interactive = false,
}: {
  children: ReactNode;
  className?: string;
  label: string;
  interactive?: boolean;
}) {
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const dragRef = useRef<{
    pointerId: number;
    x: number;
    y: number;
    offset: { x: number; y: number };
    width: number;
    height: number;
  } | null>(null);

  return (
    <div
      className={`${styles.draggableItem} ${className ?? ""}`}
      role={interactive ? "group" : "button"}
      tabIndex={0}
      aria-label={`Move ${label}`}
      aria-description="Drag to move, or use arrow keys. Hold Shift for larger steps."
      data-dragging={dragging || undefined}
      style={{ transform: `translate(${offset.x * 100}%, ${offset.y * 100}%)` }}
      onPointerDown={(event) => {
        if (interactive && event.target instanceof Element && event.target.closest("button")) {
          return;
        }
        if (event.button !== 0 || dragRef.current) {
          return;
        }
        event.preventDefault();
        event.currentTarget.focus({ preventScroll: true });
        const { width, height } = event.currentTarget.getBoundingClientRect();
        dragRef.current = {
          pointerId: event.pointerId,
          x: event.clientX,
          y: event.clientY,
          offset,
          width,
          height,
        };
        event.currentTarget.setPointerCapture(event.pointerId);
        setDragging(true);
      }}
      onPointerMove={(event) => {
        const drag = dragRef.current;
        if (!drag || drag.pointerId !== event.pointerId) {
          return;
        }
        setOffset({
          x: drag.offset.x + (event.clientX - drag.x) / drag.width,
          y: drag.offset.y + (event.clientY - drag.y) / drag.height,
        });
      }}
      onPointerUp={(event) => {
        if (dragRef.current?.pointerId === event.pointerId) {
          event.currentTarget.releasePointerCapture(event.pointerId);
          dragRef.current = null;
          setDragging(false);
        }
      }}
      onLostPointerCapture={() => {
        dragRef.current = null;
        setDragging(false);
      }}
      onKeyDown={(event) => {
        if (event.target !== event.currentTarget) {
          return;
        }
        const directions: Record<string, { x: number; y: number }> = {
          ArrowLeft: { x: -1, y: 0 },
          ArrowRight: { x: 1, y: 0 },
          ArrowUp: { x: 0, y: -1 },
          ArrowDown: { x: 0, y: 1 },
        };
        const direction = directions[event.key];
        if (!direction) {
          return;
        }
        event.preventDefault();
        const { width, height } = event.currentTarget.getBoundingClientRect();
        const step = event.shiftKey ? 20 : 5;
        setOffset((current) => ({
          x: current.x + direction.x * step / width,
          y: current.y + direction.y * step / height,
        }));
      }}
    >
      {children}
    </div>
  );
}

const TOOLS: ReadonlyArray<{ label: string; icon: ReactNode }> = [
  { label: "Select", icon: <path d="M4.04 4.65a.5.5 0 0 1 .61-.61l15.5 5.94a.5.5 0 0 1-.05.95l-6.1 1.88a1 1 0 0 0-.66.66l-1.88 6.1a.5.5 0 0 1-.95.05z" /> },
  { label: "Pen", icon: <path d="M21.17 6.81a1 1 0 0 0-3.99-3.99L3.84 16.17a2 2 0 0 0-.5.83l-1.32 4.35a.5.5 0 0 0 .62.62l4.35-1.32a2 2 0 0 0 .83-.5z" /> },
  {
    label: "Eraser",
    icon: (
      <>
        <path d="m7 21-4.3-4.3c-1-1-1-2.5 0-3.4l9.6-9.6c1-1 2.5-1 3.4 0l5.6 5.6c1 1 1 2.5 0 3.4L13 21" />
        <path d="M22 21H7" />
        <path d="m5 11 9 9" />
      </>
    ),
  },
  {
    label: "Arrow",
    icon: (
      <>
        <path d="M7 17 17 7" />
        <path d="M7 7h10v10" />
      </>
    ),
  },
  { label: "Rectangle", icon: <rect x="3" y="3" width="18" height="18" rx="2" /> },
  {
    label: "Text",
    icon: (
      <>
        <path d="M12 4v16" />
        <path d="M4 7V5a1 1 0 0 1 1-1h14a1 1 0 0 1 1 1v2" />
        <path d="M9 20h6" />
      </>
    ),
  },
  {
    label: "Image",
    icon: (
      <>
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <circle cx="9" cy="9" r="2" />
        <path d="m21 15-3.09-3.09a2 2 0 0 0-2.82 0L6 21" />
      </>
    ),
  },
];

function MockToolbar() {
  const [showNotification, setShowNotification] = useState(false);
  const notificationTimer = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(notificationTimer.current), []);

  const dismissNotification = () => {
    window.clearTimeout(notificationTimer.current);
    setShowNotification(false);
  };

  const openNotification = () => {
    window.clearTimeout(notificationTimer.current);
    setShowNotification(true);
    notificationTimer.current = window.setTimeout(() => setShowNotification(false), 3500);
  };

  return (
    <div className={styles.toolbarDock}>
      <div className={styles.toolbarNotificationRegion} role="status">
        <div
          className={styles.toolbarNotification}
          data-visible={showNotification || undefined}
          aria-hidden={!showNotification}
          inert={!showNotification}
        >
          <span>Go to <Link href="https://app.kritzel.io" target="_blank" rel="noopener noreferrer">full demo</Link></span>
          <button type="button" aria-label="Dismiss notification" onClick={dismissNotification}>
            <Icon size={16}><path d="m6 6 12 12M18 6 6 18" /></Icon>
          </button>
        </div>
      </div>
      <div className={styles.historyTab}>
        <button type="button" aria-label="Undo" className={styles.historyButton} onClick={openNotification}>
          <Icon size={18}>
            <path d="M9 14 4 9l5-5" />
            <path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11" />
          </Icon>
        </button>
        <button type="button" aria-label="Redo" className={styles.historyButton} onClick={openNotification}>
          <Icon size={18}>
            <path d="m15 14 5-5-5-5" />
            <path d="M20 9H9.5a5.5 5.5 0 0 0 0 11H13" />
          </Icon>
        </button>
        <span className={styles.historyDivider} />
        <button type="button" aria-label="Delete" className={styles.historyButton} data-active="true" onClick={openNotification}>
          <Icon size={18}>
            <path d="M3 6h18" />
            <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
            <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
            <path d="M10 11v6M14 11v6" />
          </Icon>
        </button>
      </div>
      <div className={styles.toolbar}>
        {TOOLS.map((tool, index) => (
          <button type="button" aria-label={tool.label} key={tool.label} className={styles.tool} data-selected={index === 0 ? "true" : undefined} onClick={openNotification}>
            <Icon size={20}>{tool.icon}</Icon>
          </button>
        ))}
      </div>
    </div>
  );
}

export default function Hero({
  docsPath,
  variant = "infinite",
}: {
  docsPath: string;
  variant?: "infinite" | "agentic";
}) {
  const navRef = useRef<HTMLElement>(null);
  const grassImageUrl = useBaseUrl("/img/wet_grass.webp");

  useEffect(() => {
    const nav = navRef.current;
    if (!nav) {
      return;
    }

    const root = document.documentElement;
    const observer = new IntersectionObserver(([entry]) => {
      root.classList.toggle("landing-nav-visible", !entry.isIntersecting);
    });
    observer.observe(nav);

    return () => {
      observer.disconnect();
      root.classList.remove("landing-nav-visible");
    };
  }, []);

  return (
    <div className={styles.heroWrapper}>
      <div className={styles.heroCanvas}>
        <Link to="/" className={styles.brand}>
          <svg width="40" height="35" viewBox="0 0 321.05759 277.97299" aria-hidden="true">
            <path fill="currentColor" d={KRITZEL_LOGO_PATH} />
          </svg>
          Kritzel
        </Link>
        <nav ref={navRef} aria-label="Main" className={styles.topNav}>
          <Link to="/blog" className={styles.topNavLink}>
            Blog
          </Link>
          <Link to={docsPath} className={styles.topNavLink}>
            Documentation
          </Link>
          <Link to="/get-license" className={styles.topNavCta}>
            Get License
          </Link>
          <Link href="https://github.com/kasual1/kritzel" aria-label="GitHub" className={styles.topNavIcon}>
            <GitHubIcon />
          </Link>
        </nav>

        <div className={styles.heroCopy}>
          <div className={styles.heroCopyInner}>
            <nav className={styles.canvasToggle} aria-label="Canvas experience">
              <Link to="/" aria-current={variant === "infinite" ? "page" : undefined}>
                Infinite
              </Link>
              <Link to="/agentic" aria-current={variant === "agentic" ? "page" : undefined}>
                Agentic
              </Link>
            </nav>
            <HeroTitle />
            <p className={styles.heroSubtitle}>
              Kritzel is a framework-agnostic infinite canvas library that helps you build custom whiteboard
              experiences with React, Vue and Angular.
            </p>
            <CallToActionBar docsPath={docsPath} />
          </div>
        </div>

        <div className={styles.canvasLayer}>
          <div className={styles.grassImageAnchor}>
            <DraggableCanvasItem label="wet grass image">
              <img className={styles.grassImage} src={grassImageUrl} alt="Wet grass" draggable={false} />
            </DraggableCanvasItem>
          </div>
          <div className={styles.calculatorAnchor}>
            <DraggableCanvasItem label="calculator" interactive>
              <Calculator />
            </DraggableCanvasItem>
          </div>
          <div className={styles.halloDrawing}>
            <DraggableCanvasItem label="handwritten hallo!">
              <svg aria-hidden="true" viewBox="0 0 260 120" width="100%" height="100%">
                <path
                  d="M18 88 C27 62 49 12 38 16 C24 20 20 72 22 88
                     C31 49 52 48 49 72 C47 91 53 93 65 80
                     C73 52 88 51 86 69 C83 91 58 99 60 77
                     C62 59 80 52 86 62 C84 75 78 94 90 88 C94 85 96 81 98 77
                     C112 57 132 8 117 16 C101 26 96 77 105 88 C114 100 128 88 138 70
                     C153 43 163 10 150 17 C136 25 126 78 139 89 C151 101 169 83 176 70
                     C184 52 207 53 207 72 C207 94 179 104 174 83 C170 66 183 57 194 60
                     C207 65 211 90 225 77"
                  fill="none"
                  className={styles.halloStroke}
                  pathLength={1}
                  stroke="#4a7dff"
                  strokeWidth="5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M240 32 C239 45 237 59 236 72"
                  fill="none"
                  className={styles.halloExclamation}
                  pathLength={1}
                  stroke="#4a7dff"
                  strokeWidth="5"
                  strokeLinecap="round"
                />
                <path
                  d="M235 88 L235 90"
                  fill="none"
                  className={styles.halloDot}
                  stroke="#4a7dff"
                  strokeWidth="5"
                  strokeLinecap="round"
                />
              </svg>
            </DraggableCanvasItem>
          </div>
        </div>
      </div>
      <div className={styles.toolbarViewport}>
        <MockToolbar />
      </div>
    </div>
  );
}
