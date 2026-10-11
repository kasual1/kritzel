import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import Link from "@docusaurus/Link";
import useBaseUrl from "@docusaurus/useBaseUrl";
import Icon, { GitHubIcon } from "./Icon";
import { CallToActionBar } from "./Sections";
import Calculator from "./Calculator";
import HeroTitle from "./HeroTitle";
import ImageCard from "./ImageCard";
import MenuButton from "./MenuButton";
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

// Temporarily hidden while the /agentic page is disabled.
const SHOW_CANVAS_TOGGLE = false;

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

// Drawn in order within --hallo-draw-duration (1500ms): the H's two stems and crossbar, then "ello".
const HELLO_STROKES: ReadonlyArray<{ d: string; offset: string; duration: string }> = [
  { d: "M24 18 C23 42 21 66 19 88", offset: "0ms", duration: "250ms" },
  { d: "M58 16 C57 40 55 64 53 88", offset: "280ms", duration: "250ms" },
  { d: "M23 55 C33 54 44 52 56 51", offset: "560ms", duration: "180ms" },
  {
    d: `M68 76 C77 73.5 88.9 69.3 88 60 C87.5 54.9 80.9 51.8 76 53 C68.2 55 64.6 64 65 72 C65.5 81.1 72.9 90.5 82 90 C92.9 89.4 98.1 79.1 104 70
        C113.7 55 118.2 41.8 120 24 C120.4 20.1 119.3 12.7 116 14 C103.1 19.2 99.3 89.6 116 90 C123.2 90.2 133.7 78.2 140 68
        C149 53.5 153.9 41 155 24 C155.3 20.1 154.3 12.7 151 14 C138.1 19.2 135.3 89.6 152 90 C159.7 90.2 171.4 77 177 65.5
        C179.7 59.9 184.8 56 191 56 C200.1 56 207 65.9 207 75 C207 84.1 200.1 94 191 94 C181.9 94 175 84.1 175 75
        C175 71.4 175.4 68.7 177 65.5 C179.7 59.9 184.8 56 191 56 C197.8 56 202.5 58.1 209 60 C214 61.4 218.1 59.6 223 58`,
    offset: "780ms",
    duration: "720ms",
  },
];

function HalloDrawing({ className }: { className: string }) {
  const halloRef = useRef<SVGSVGElement>(null);

  useLayoutEffect(() => {
    const svg = halloRef.current;
    const item = svg?.parentElement;
    if (!svg || !item) return;
    const updateBounds = () => {
      if (svg.getClientRects().length === 0) return;
      const bounds = svg.getBBox();
      const viewBox = svg.viewBox.baseVal;
      const strokePadding = 2.5;
      item.style.setProperty("--hallo-selection-left", `${(bounds.x - strokePadding - viewBox.x) / viewBox.width * 100}%`);
      item.style.setProperty("--hallo-selection-top", `${(bounds.y - strokePadding - viewBox.y) / viewBox.height * 100}%`);
      item.style.setProperty("--hallo-selection-width", `${(bounds.width + strokePadding * 2) / viewBox.width * 100}%`);
      item.style.setProperty("--hallo-selection-height", `${(bounds.height + strokePadding * 2) / viewBox.height * 100}%`);
    };
    updateBounds();
    const observer = new ResizeObserver(updateBounds);
    observer.observe(svg);
    return () => observer.disconnect();
  }, []);

  return (
    <div className={`${styles.halloDrawing} ${className}`}>
      <DraggableCanvasItem label="handwritten Hello!">
        <svg ref={halloRef} aria-hidden="true" viewBox="0 0 260 120" width="100%" height="100%">
          {HELLO_STROKES.map((stroke) => (
            <path
              key={stroke.d}
              d={stroke.d}
              fill="none"
              className={styles.halloStroke}
              style={{ "--stroke-offset": stroke.offset, "--stroke-duration": stroke.duration } as CSSProperties}
              pathLength={1}
              stroke="#4a7dff"
              strokeWidth="5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          ))}
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
  const wrapperRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const copyRef = useRef<HTMLDivElement>(null);
  const grassImageUrl = useBaseUrl("/img/wet_grass.webp");

  useLayoutEffect(() => {
    const wrapper = wrapperRef.current;
    const canvas = canvasRef.current;
    const copy = copyRef.current;
    const toolbar = wrapper?.querySelector<HTMLElement>(`.${styles.toolbarDock}`);
    const drawing = wrapper?.querySelector<SVGSVGElement>(`.${styles.halloTablet} svg`);
    if (!wrapper || !canvas || !copy || !toolbar || !drawing) return;

    const updatePosition = () => {
      const canvasTop = canvas.getBoundingClientRect().top;
      const copyBottom = copy.getBoundingClientRect().bottom;
      // offsetTop ignores the toolbar's entrance translate animation, which getBoundingClientRect includes.
      const toolbarParent = toolbar.offsetParent;
      const toolbarTop = (toolbarParent?.getBoundingClientRect().top ?? canvasTop) + toolbar.offsetTop;
      const bounds = drawing.getBBox();
      const viewBox = drawing.viewBox.baseVal;
      const scale = drawing.getBoundingClientRect().height / viewBox.height;
      const strokeCenterOffset = (bounds.y + bounds.height / 2 - viewBox.y - viewBox.height / 2) * scale;
      wrapper.style.setProperty("--hallo-center-top", `${(copyBottom + toolbarTop) / 2 - canvasTop - strokeCenterOffset}px`);
    };
    updatePosition();
    const observer = new ResizeObserver(updatePosition);
    [canvas, copy, toolbar, drawing].forEach((element) => observer.observe(element));
    let resizeFrame = 0;
    const updateAfterResize = () => {
      window.cancelAnimationFrame(resizeFrame);
      resizeFrame = window.requestAnimationFrame(updatePosition);
    };
    window.addEventListener("resize", updateAfterResize);
    return () => {
      observer.disconnect();
      window.cancelAnimationFrame(resizeFrame);
      window.removeEventListener("resize", updateAfterResize);
    };
  }, []);

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

    // Only animate the floating navbar once the page has settled, so arriving here from another
    // page hides it instantly instead of sliding it away.
    let frame = window.requestAnimationFrame(() => {
      frame = window.requestAnimationFrame(() => root.setAttribute("data-landing-nav-animated", ""));
    });

    return () => {
      observer.disconnect();
      window.cancelAnimationFrame(frame);
      root.classList.remove("landing-nav-visible");
      root.removeAttribute("data-landing-nav-animated");
    };
  }, []);

  return (
    <div ref={wrapperRef} className={styles.heroWrapper}>
      <div ref={canvasRef} className={styles.heroCanvas}>
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
          <MenuButton />
        </nav>

        <div className={styles.heroCopy}>
          <div ref={copyRef} className={styles.heroCopyInner}>
            {SHOW_CANVAS_TOGGLE && (
              <nav className={styles.canvasToggle} aria-label="Canvas experience">
                <Link to="/" aria-current={variant === "infinite" ? "page" : undefined}>
                  Infinite
                </Link>
                <Link to="/agentic" aria-current={variant === "agentic" ? "page" : undefined}>
                  Agentic
                </Link>
              </nav>
            )}
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
              <ImageCard>
                <img className={styles.grassImage} src={grassImageUrl} alt="Wet grass" draggable={false} />
              </ImageCard>
            </DraggableCanvasItem>
          </div>
          <div className={styles.calculatorAnchor}>
            <DraggableCanvasItem label="calculator" interactive>
              <Calculator />
            </DraggableCanvasItem>
          </div>
          <HalloDrawing className={styles.halloDesktop} />
          <HalloDrawing className={styles.halloTablet} />
        </div>
      </div>
      <div className={styles.toolbarViewport}>
        <MockToolbar />
      </div>
    </div>
  );
}
