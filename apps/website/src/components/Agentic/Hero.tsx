import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import Link from "@docusaurus/Link";
import useBaseUrl from "@docusaurus/useBaseUrl";
import Icon, { GitHubIcon } from "../Landing/Icon";
import HeroTitle from "../Landing/HeroTitle";
import ImageCard from "../Landing/ImageCard";
import PieChart from "./PieChart";
import { CallToActionBar } from "./CallToActionBar";
import { KRITZEL_LOGO_PATH } from "../Landing/paths";
import styles from "./styles.module.css";

function DraggableCanvasItem({
  children,
  className,
  label,
  selected,
  onSelect,
  resetOffset = false,
}: {
  children: ReactNode;
  className?: string;
  label: string;
  selected?: boolean;
  onSelect?: () => void;
  resetOffset?: boolean;
}) {
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [centering, setCentering] = useState(false);
  const dragRef = useRef<{
    pointerId: number;
    x: number;
    y: number;
    offset: { x: number; y: number };
    width: number;
    height: number;
  } | null>(null);

  useLayoutEffect(() => {
    if (!resetOffset) return;
    const animate = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    setCentering(animate);
    setOffset({ x: 0, y: 0 });
    if (!animate) return;
    const timer = window.setTimeout(() => setCentering(false), 700);
    return () => window.clearTimeout(timer);
  }, [resetOffset]);

  return (
    <div
      className={`${styles.draggableItem} ${centering ? styles.centeringItem : ""} ${className ?? ""}`}
      role="button"
      tabIndex={0}
      aria-label={`Move ${label}`}
      aria-pressed={selected}
      aria-description="Drag to move, or use arrow keys. Hold Shift for larger steps."
      data-dragging={dragging || undefined}
      style={{ transform: `translate(${offset.x * 100}%, ${offset.y * 100}%)` }}
      onClick={onSelect}
      onPointerDown={(event) => {
        if (event.button !== 0 || dragRef.current || centering) {
          return;
        }
        event.preventDefault();
        onSelect?.();
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
        if (onSelect && (event.key === "Enter" || event.key === " ")) {
          event.preventDefault();
          onSelect();
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
        if (centering) return;
        onSelect?.();
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

const INITIAL_COMMAND = "Lets focus on the image with the red running shoe";
const CASUAL_COMMAND = "Create a more casual variant of the red running shoe.";
const SUMMER_COMMAND = "Create a summer variant of the red running shoe";

function MockChatBox({
  onSubmit,
  onReset,
  shoeFocused,
  command,
  canReset,
}: {
  onSubmit: () => void;
  onReset: () => void;
  shoeFocused: boolean;
  command: string;
  canReset: boolean;
}) {
  const [visibleCount, setVisibleCount] = useState(0);

  useEffect(() => {
    if (!shoeFocused) {
      return;
    }
    const motionPreference = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (motionPreference.matches) {
      setVisibleCount(command.length);
      return;
    }
    setVisibleCount(0);
    let count = 0;
    const timer = window.setInterval(() => {
      count += 1;
      setVisibleCount(count);
      if (count === command.length) window.clearInterval(timer);
    }, 40);
    const finish = () => {
      if (!motionPreference.matches) return;
      window.clearInterval(timer);
      setVisibleCount(command.length);
    };
    motionPreference.addEventListener("change", finish);
    return () => {
      window.clearInterval(timer);
      motionPreference.removeEventListener("change", finish);
    };
  }, [shoeFocused, command]);

  return (
    <div className={styles.chatDock}>
      <div className={styles.chatBox}>
        <span className={styles.chatMessage} aria-label={command}>
          <span className={styles.chatMessageSizer} aria-hidden="true">{command}</span>
          <span className={styles.chatMessageText} aria-hidden="true">
            {shoeFocused ? command.slice(0, visibleCount) : INITIAL_COMMAND}
            {shoeFocused && visibleCount < command.length && <span className={styles.chatTypingCursor} />}
          </span>
        </span>
        <button
          type="button"
          className={styles.chatSend}
          aria-label={canReset ? "Reset demo" : shoeFocused ? command : "Focus on the red running shoe"}
          onClick={canReset ? onReset : onSubmit}
        >
          <Icon size={20}>
            {canReset ? (
              <>
                <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                <path d="M3 3v5h5" />
              </>
            ) : (
              <path d="M12 19V5M6 11l6-6 6 6" />
            )}
          </Icon>
        </button>
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
  const [resetCount, setResetCount] = useState(0);
  return (
    <HeroScene
      key={resetCount}
      docsPath={docsPath}
      variant={variant}
      onReset={() => setResetCount((current) => current + 1)}
    />
  );
}

function HeroScene({
  docsPath,
  variant,
  onReset,
}: {
  docsPath: string;
  variant: "infinite" | "agentic";
  onReset: () => void;
}) {
  const navRef = useRef<HTMLElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const copyRef = useRef<HTMLDivElement>(null);
  const copyInnerRef = useRef<HTMLDivElement>(null);
  const shoeRef = useRef<HTMLDivElement>(null);
  const [focusRequest, setFocusRequest] = useState(0);
  const [variantStatus, setVariantStatus] = useState<"idle" | "left-loading" | "left-ready" | "right-loading" | "ready">("idle");
  const [selectedImage, setSelectedImage] = useState<"shoe" | "left" | "right" | "pie" | "smiley" | null>(null);
  const [focusLayout, setFocusLayout] = useState({ copyShift: 0, shoeTop: 0, minHeight: 520 });
  const shoeFocused = focusRequest > 0;
  const shoeImageUrl = useBaseUrl("/img/red_running_shoe_3.jpg");
  const leftVariantUrl = useBaseUrl("/img/red_running_shoe_variant_1.jpg");
  const rightVariantUrl = useBaseUrl("/img/red_running_shoe_variant_2.jpg");

  useEffect(() => {
    const deselectOutsideHero = (event: PointerEvent) => {
      if (event.target instanceof Node && !wrapperRef.current?.contains(event.target)) {
        setSelectedImage(null);
      }
    };
    document.addEventListener("pointerdown", deselectOutsideHero);
    return () => document.removeEventListener("pointerdown", deselectOutsideHero);
  }, []);

  useEffect(() => {
    if (variantStatus !== "left-loading" && variantStatus !== "right-loading") return;
    const timer = window.setTimeout(
      () => {
        if (variantStatus === "left-loading") {
          setSelectedImage((current) => current === "left" ? null : current);
          setVariantStatus("left-ready");
        } else {
          setSelectedImage((current) => current === "right" ? null : current);
          setVariantStatus("ready");
        }
      },
      800,
    );
    return () => window.clearTimeout(timer);
  }, [variantStatus]);

  useLayoutEffect(() => {
    if (!shoeFocused) {
      return;
    }
    const wrapper = wrapperRef.current;
    const canvas = canvasRef.current;
    const copy = copyRef.current;
    const inner = copyInnerRef.current;
    const shoe = shoeRef.current;
    const nav = navRef.current;
    const chat = wrapper?.querySelector<HTMLElement>(`.${styles.chatDock}`);
    const toggle = inner?.querySelector<HTMLElement>(`.${styles.canvasToggle}`);
    if (!canvas || !copy || !inner || !shoe || !nav || !chat || !toggle) {
      return;
    }
    const updateLayout = () => {
      const copyTop = copy.offsetTop + inner.offsetTop;
      const toggleGap = parseFloat(getComputedStyle(toggle).bottom) - inner.offsetHeight;
      const raisedTop = nav.offsetTop + nav.offsetHeight + toggle.offsetHeight + toggleGap + 16;
      const copyShift = copyTop - raisedTop;
      const availableTop = copyTop - copyShift + inner.offsetHeight + 24;
      const chatTop = canvas.clientHeight - parseFloat(getComputedStyle(chat).bottom) - chat.offsetHeight * 0.85;
      const availableBottom = chatTop - 24;
      const halfShoeHeight = shoe.offsetHeight / 2;
      const minHeight = availableTop + shoe.offsetHeight + 24
        + chat.offsetHeight * 0.85 + parseFloat(getComputedStyle(chat).bottom);
      const shoeTop = Math.max(
        availableTop + halfShoeHeight,
        Math.min(canvas.clientHeight / 2, availableBottom - halfShoeHeight),
      );
      setFocusLayout({ copyShift, shoeTop, minHeight });
    };
    updateLayout();
    const observer = new ResizeObserver(updateLayout);
    [canvas, inner, shoe, nav, chat, toggle].forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, [shoeFocused, focusRequest]);

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
    <div
      ref={wrapperRef}
      onPointerDownCapture={() => setSelectedImage(null)}
      onClickCapture={(event) => {
        if (event.target instanceof Element && !event.target.closest(`.${styles.draggableItem}`)) {
          setSelectedImage(null);
        }
      }}
      className={`${styles.heroWrapper} ${shoeFocused ? styles.heroFocused : ""} ${
        variantStatus === "left-loading" || variantStatus === "left-ready" ? styles.heroPair : ""
      } ${variantStatus === "right-loading" || variantStatus === "ready" ? styles.heroTrio : ""}`}
      style={{
        "--focus-copy-shift": `${focusLayout.copyShift}px`,
        "--focus-shoe-top": `${focusLayout.shoeTop}px`,
        "--focus-min-height": `${focusLayout.minHeight}px`,
      } as CSSProperties}
    >
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
        </nav>

        <div ref={copyRef} className={styles.heroCopy}>
          <div ref={copyInnerRef} className={styles.heroCopyInner}>
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
            <p className={styles.heroSubtitle} hidden={shoeFocused}>
              Kritzel is a framework-agnostic infinite canvas library that helps you build agentic whiteboard
              experiences with React, Vue and Angular.
            </p>
            <CallToActionBar docsPath={docsPath} />
          </div>
        </div>

        <div className={styles.canvasLayer}>
          {variantStatus !== "idle" && (
            <>
              <div className={`${styles.variantPlaceholder} ${styles.variantPlaceholderLeft}`}>
                <DraggableCanvasItem
                  label="left shoe variant"
                  selected={selectedImage === "left"}
                  onSelect={() => setSelectedImage("left")}
                  className={selectedImage === "left" ? styles.selectedImage : undefined}
                >
                  <ImageCard>
                    {variantStatus === "left-loading" ? <div className={styles.variantSkeleton} aria-hidden="true" /> : (
                      <img className={styles.variantImage} src={leftVariantUrl} alt="Red running shoe variant with a knitted ankle cuff" draggable={false} />
                    )}
                  </ImageCard>
                </DraggableCanvasItem>
              </div>
              {(variantStatus === "right-loading" || variantStatus === "ready") && (
              <div className={`${styles.variantPlaceholder} ${styles.variantPlaceholderRight}`}>
                <DraggableCanvasItem
                  label="right shoe variant"
                  selected={selectedImage === "right"}
                  onSelect={() => setSelectedImage("right")}
                  className={selectedImage === "right" ? styles.selectedImage : undefined}
                >
                  <ImageCard>
                    {variantStatus === "right-loading" ? <div className={styles.variantSkeleton} aria-hidden="true" /> : (
                      <img className={styles.variantImage} src={rightVariantUrl} alt="Red running shoe variant with a buckle strap" draggable={false} />
                    )}
                  </ImageCard>
                </DraggableCanvasItem>
              </div>
              )}
            </>
          )}
          <div ref={shoeRef} className={styles.slippersImageAnchor}>
            <DraggableCanvasItem
              resetOffset={shoeFocused}
              label="running shoe image"
              selected={selectedImage === "shoe"}
              onSelect={() => setSelectedImage("shoe")}
              className={selectedImage === "shoe" ? styles.selectedImage : undefined}
            >
              <ImageCard>
                <img
                  className={styles.slippersImage}
                  src={shoeImageUrl}
                  alt="Running shoe with red accents on a white background"
                  draggable={false}
                />
              </ImageCard>
            </DraggableCanvasItem>
          </div>
          <div className={styles.pieChartAnchor} inert={shoeFocused} aria-hidden={shoeFocused}>
            <DraggableCanvasItem
              label="3D pie chart with 75%, 20%, and 5% slices"
              selected={selectedImage === "pie"}
              onSelect={() => setSelectedImage("pie")}
              className={selectedImage === "pie" ? styles.selectedImage : undefined}
            >
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
          <div className={styles.smileyAnchor} inert={shoeFocused} aria-hidden={shoeFocused}>
            <DraggableCanvasItem
              label="hand-drawn smiley face"
              selected={selectedImage === "smiley"}
              onSelect={() => setSelectedImage("smiley")}
              className={selectedImage === "smiley" ? styles.selectedImage : undefined}
            >
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
                  { d: "M116 65 C113 72 115 79 117 82", delay: 1220, duration: 120, blink: true },
                  { d: "M51 106 C61 132 103 142 129 108", delay: 1340, duration: 350 },
                  { d: "M65 27 C57 19 54 12 58 8", delay: 1690, duration: 100 },
                  { d: "M82 22 C77 13 79 7 84 5", delay: 1790, duration: 100 },
                  { d: "M99 23 C99 14 104 8 111 9", delay: 1890, duration: 100 },
                  { d: "M115 28 C120 20 128 17 133 20", delay: 1990, duration: 100 },
                ].map(({ d, delay, duration, blink }) => (
                  <g key={d}>
                    <g className={blink ? styles.smileyOpenEye : undefined}>
                      <path
                        d={d}
                        pathLength={1}
                        className={styles.smileyStroke}
                        style={{ animationDelay: `${delay}ms`, animationDuration: `${duration}ms` }}
                      />
                    </g>
                    {blink && <path className={styles.smileyClosedEye} d="M107 76 Q116 70 125 76" />}
                  </g>
                ))}
              </svg>
            </DraggableCanvasItem>
          </div>
        </div>
      </div>
      <div className={styles.chatViewport}>
        <MockChatBox
          onReset={onReset}
          shoeFocused={shoeFocused}
          command={!shoeFocused ? INITIAL_COMMAND : variantStatus === "idle" || variantStatus === "left-loading" ? CASUAL_COMMAND : SUMMER_COMMAND}
          canReset={variantStatus === "right-loading" || variantStatus === "ready"}
          onSubmit={() => {
            if (variantStatus === "left-ready") {
              setSelectedImage("right");
              setVariantStatus("right-loading");
            } else if (shoeFocused && variantStatus === "idle") {
              setSelectedImage("left");
              setVariantStatus("left-loading");
            } else if (!shoeFocused) {
              setSelectedImage("shoe");
              setFocusRequest((current) => current + 1);
            }
          }}
        />
      </div>
      <span className={styles.focusAnnouncement} role="status">
        {variantStatus === "ready"
          ? "Two red running shoe variants created."
          : variantStatus === "left-loading"
          ? "Loading the left red running shoe variant."
          : variantStatus === "right-loading"
          ? "Left variant created. Loading the right red running shoe variant."
          : variantStatus === "left-ready"
          ? "Casual variant created. Submit the summer variant command to continue."
          : shoeFocused ? "Red running shoe selected and centered." : ""}
      </span>
    </div>
  );
}
