import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import Link from "@docusaurus/Link";
import Icon, { GitHubIcon } from "../Landing/Icon";
import HeroTitle from "../Landing/HeroTitle";
import { CallToActionBar } from "./CallToActionBar";
import { KRITZEL_LOGO_PATH } from "../Landing/paths";
import styles from "./styles.module.css";

const GRID_X = [20, 40, 60, 80, 100, 120, 140, 160, 180, 200, 220];
const GRID_Y = [10, 30, 50, 70, 90, 110, 130, 150];

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

function PhotoGrid({ stroke }: { stroke: string }) {
  return (
    <g stroke={stroke} strokeWidth="1">
      {GRID_X.map((x) => (
        <path key={`x${x}`} d={`M${x} 0V170`} />
      ))}
      {GRID_Y.map((y) => (
        <path key={`y${y}`} d={`M0 ${y}H240`} />
      ))}
    </g>
  );
}

/** Hand-drawn style sketches shown as "photos" placed on the mock canvas. */
const PHOTOS: ReadonlyArray<{
  className: string;
  rotate: number;
  art: ReactNode;
  note: { className: string; text: string; caret: string };
}> = [
  {
    className: styles.photoParabola,
    rotate: -5,
    note: { className: styles.noteEquation, text: "f(x) = −x² + 4x", caret: "#4a7dff" },
    art: (
      <>
        <rect width="240" height="170" fill="#ffc7a8" />
        <PhotoGrid stroke="#ffb48f" />
        <path d="M20 130 H224 M40 154 V16" stroke="#3a3160" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M60 150 Q120 -10 180 150" fill="none" stroke="#e2603a" strokeWidth="4" strokeLinecap="round" />
        <path d="M120 70 V130" stroke="#3a3160" strokeWidth="1.5" strokeDasharray="4 4" />
        <circle cx="120" cy="70" r="6" fill="#ffffff" stroke="#3a3160" strokeWidth="3" />
        <circle cx="68" cy="130" r="4.5" fill="#3a3160" />
        <circle cx="172" cy="130" r="4.5" fill="#3a3160" />
      </>
    ),
  },
  {
    className: styles.photoShapes,
    rotate: 5,
    note: { className: styles.noteVertex, text: "the vertex is the highest point, at x = 2!", caret: "#f97316" },
    art: (
      <>
        <rect width="240" height="170" fill="#9fd3ff" />
        <PhotoGrid stroke="#84c3f2" />
        <circle cx="92" cy="86" r="44" fill="#4c9bd6" opacity="0.85" />
        <rect x="108" y="44" width="78" height="78" fill="#e3f3ff" opacity="0.85" stroke="#1f4d7a" strokeWidth="3" />
        <circle cx="92" cy="86" r="44" fill="none" stroke="#1f4d7a" strokeWidth="3" />
        <path d="M150 140 L190 66 L226 140 Z" fill="#3f6283" opacity="0.9" stroke="#1f4d7a" strokeWidth="3" strokeLinejoin="round" />
        <path d="M92 86 L136 86" stroke="#1f4d7a" strokeWidth="2" strokeDasharray="4 4" />
        <circle cx="92" cy="86" r="3.5" fill="#1f4d7a" />
      </>
    ),
  },
  {
    className: styles.photoCube,
    rotate: -3,
    note: { className: styles.noteCube, text: "a cube has 6 faces and 12 edges", caret: "#8b5cf6" },
    art: (
      <>
        <rect width="240" height="170" fill="#a8d9b4" />
        <PhotoGrid stroke="#8cc49a" />
        <path d="M80 48 L124 70 L124 122 L80 100 Z" fill="#5a9c6b" stroke="#1f5636" strokeWidth="3" strokeLinejoin="round" />
        <path d="M124 70 L168 48 L168 100 L124 122 Z" fill="#2c6a45" stroke="#1f5636" strokeWidth="3" strokeLinejoin="round" />
        <path d="M80 48 L124 26 L168 48 L124 70 Z" fill="#cfeedd" stroke="#1f5636" strokeWidth="3" strokeLinejoin="round" />
        <path d="M80 100 L124 78 L168 100" fill="none" stroke="#1f5636" strokeWidth="1.5" strokeDasharray="4 4" opacity="0.6" />
        <path d="M186 142 L204 96 L226 142 Z" fill="#5a9c6b" stroke="#1f5636" strokeWidth="3" strokeLinejoin="round" />
        <path d="M204 96 L212 142" stroke="#1f5636" strokeWidth="2" />
        <ellipse cx="44" cy="132" rx="22" ry="8" fill="#cfeedd" stroke="#1f5636" strokeWidth="3" />
        <path d="M22 132 L44 90 L66 132" fill="none" stroke="#1f5636" strokeWidth="3" strokeLinejoin="round" />
      </>
    ),
  },
];

function MockChatBox() {
  return (
    <div className={styles.chatDock} aria-hidden="true">
      <div className={styles.chatBox}>
        <span className={styles.chatMessage}>Lets look at the image at the bottom right</span>
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
          {PHOTOS.map((photo) => (
            <div key={photo.className} className={photo.className}>
              <DraggableCanvasItem label={`${photo.note.text} image`}>
                <div className={styles.photoFrame} style={{ "--photo-rotate": `${photo.rotate}deg` } as CSSProperties}>
                <div className={styles.photoImage}>
                  <svg aria-hidden="true" viewBox="0 0 240 170" width="100%" height="100%" preserveAspectRatio="xMidYMid slice">
                    {photo.art}
                  </svg>
                </div>
                </div>
              </DraggableCanvasItem>
              <DraggableCanvasItem className={photo.note.className} label={photo.note.text}>
                {photo.note.text}
                <span aria-hidden="true" className={styles.caret} style={{ background: photo.note.caret }} />
              </DraggableCanvasItem>
            </div>
          ))}
        </div>
      </div>
      <div className={styles.chatViewport}>
        <MockChatBox />
      </div>
    </div>
  );
}
