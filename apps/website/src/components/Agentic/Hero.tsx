import { useEffect, useRef, useState, type ReactNode } from "react";
import Link from "@docusaurus/Link";
import Icon, { GitHubIcon } from "../Landing/Icon";
import HeroTitle from "../Landing/HeroTitle";
import PieChart from "./PieChart";
import { CallToActionBar } from "./CallToActionBar";
import { KRITZEL_LOGO_PATH } from "../Landing/paths";
import styles from "./styles.module.css";

function DraggableCanvasItem({
  children,
  className,
  label,
}: {
  children: ReactNode;
  className?: string;
  label: string;
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
      role="button"
      tabIndex={0}
      aria-label={`Move ${label}`}
      aria-description="Drag to move, or use arrow keys. Hold Shift for larger steps."
      data-dragging={dragging || undefined}
      style={{ transform: `translate(${offset.x * 100}%, ${offset.y * 100}%)` }}
      onPointerDown={(event) => {
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

function MockChatBox() {
  return (
    <div className={styles.chatDock} aria-hidden="true">
      <div className={styles.chatBox}>
        <span className={styles.chatMessage}>Lets look at the pie chart at the top right</span>
        <span className={styles.chatSend}>
          <Icon size={20}>
            <path d="M12 19V5M6 11l6-6 6 6" />
          </Icon>
        </span>
      </div>
    </div>
  );
}

export default function Hero({
  docsPath,
  variant = "agentic",
}: {
  docsPath: string;
  variant?: "infinite" | "agentic";
}) {
  const navRef = useRef<HTMLElement>(null);

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
            <HeroTitle
              prefix="The Agentic"
              className={styles.heroTitle}
              accentClassName={styles.heroTitleAccent}
            />
            <p className={styles.heroSubtitle}>
              Kritzel is a framework-agnostic infinite canvas library that helps you build agentic whiteboard
              experiences with React, Vue and Angular.
            </p>
            <CallToActionBar docsPath={docsPath} />
          </div>
        </div>

        <div className={styles.canvasLayer}>
          <div className={styles.pieChartAnchor}>
            <DraggableCanvasItem label="3D pie chart with 75%, 20%, and 5% slices">
              <PieChart fallback={
              <svg aria-hidden="true" className={styles.pieChart} viewBox="0 0 260 180" width="100%">
                <g transform="rotate(-12 130 90)">
                  <path
                    d="M34 78 A96 45 0 0 0 226 78 L226 100 A96 45 0 0 1 34 100 Z"
                    fill="#3157b8"
                  />
                  <path
                    d="M226 78 A96 45 0 0 1 130 123 L130 145 A96 45 0 0 0 226 100 Z"
                    fill="#7398f0"
                  />
                  <path
                    d="M226 78 A96 45 0 0 1 221.301 91.906 L221.301 113.906 A96 45 0 0 0 226 100 Z"
                    fill="#5276cf"
                  />
                  <path
                    d="M130 78 L226 78 A96 45 0 1 0 130 123 Z"
                    fill="#4a7dff"
                    stroke="#3157b8"
                    strokeWidth="1"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M130 78 L221.301 91.906 A96 45 0 0 1 130 123 Z"
                    fill="#a3bcff"
                    stroke="#7398f0"
                    strokeWidth="1"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M130 78 L226 78 A96 45 0 0 1 221.301 91.906 Z"
                    fill="#7398f0"
                    stroke="#5276cf"
                    strokeWidth="1"
                    strokeLinejoin="round"
                  />
                </g>
              </svg>
              } />
            </DraggableCanvasItem>
          </div>
          <div className={styles.smileyAnchor}>
            <DraggableCanvasItem label="hand-drawn smiley face">
              <svg
                className={styles.smiley}
                aria-hidden="true"
                viewBox="0 0 180 180"
                width="100%"
                fill="none"
                stroke="#42b883"
                strokeWidth="5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                {[
                  { d: "M92 22 C128 18 155 47 157 83 C161 120 134 155 94 158 C55 163 24 134 22 95 C18 57 47 24 84 22 C88 21 94 23 99 24", delay: 300, duration: 800 },
                  { d: "M62 66 C59 73 60 81 63 84", delay: 1100, duration: 120 },
                  { d: "M116 65 C113 72 115 79 117 82", delay: 1220, duration: 120 },
                  { d: "M51 106 C61 132 103 142 129 108", delay: 1340, duration: 350 },
                  { d: "M65 27 C57 19 54 12 58 8", delay: 1690, duration: 100 },
                  { d: "M82 22 C77 13 79 7 84 5", delay: 1790, duration: 100 },
                  { d: "M99 23 C99 14 104 8 111 9", delay: 1890, duration: 100 },
                  { d: "M115 28 C120 20 128 17 133 20", delay: 1990, duration: 100 },
                ].map(({ d, delay, duration }) => (
                  <path
                    key={d}
                    d={d}
                    pathLength={1}
                    className={styles.smileyStroke}
                    style={{ animationDelay: `${delay}ms`, animationDuration: `${duration}ms` }}
                  />
                ))}
              </svg>
            </DraggableCanvasItem>
          </div>
        </div>
      </div>
      <div className={styles.chatViewport}>
        <MockChatBox />
      </div>
    </div>
  );
}
