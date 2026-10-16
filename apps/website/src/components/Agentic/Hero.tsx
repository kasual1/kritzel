import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode, type RefObject } from "react";
import Link from "@docusaurus/Link";
import useBaseUrl from "@docusaurus/useBaseUrl";
import Icon, { GitHubIcon } from "../Landing/Icon";
import HeroTitle from "../Landing/HeroTitle";
import ImageCard from "../Landing/ImageCard";
import MenuButton from "../Landing/MenuButton";
import PieChart from "./PieChart";
import { CallToActionBar } from "./CallToActionBar";
import { KRITZEL_LOGO_PATH } from "../Landing/paths";
import styles from "./styles.module.css";

// On phones the canvas items can't be selected by hand (see styles.module.css), so a tap anywhere in the
// hero keeps the selection the chat command made.
const isPhoneViewport = () => window.matchMedia("(max-width: 768px)").matches;

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

type StackCard = "shoe" | "left" | "right";

function RunningShoe({
  anchorRef,
  className,
  imageUrl,
  focused,
  selected,
  onSelect,
  style,
}: {
  anchorRef: RefObject<HTMLDivElement | null>;
  className: string;
  imageUrl: string;
  focused: boolean;
  selected: boolean;
  onSelect: () => void;
  style?: CSSProperties;
}) {
  return (
    <div ref={anchorRef} className={`${styles.slippersImageAnchor} ${className}`} style={style}>
      <DraggableCanvasItem
        resetOffset={focused}
        label="running shoe image"
        selected={selected}
        onSelect={onSelect}
        className={selected ? styles.selectedImage : undefined}
      >
        <ImageCard>
          <img
            className={styles.slippersImage}
            src={imageUrl}
            alt="Running shoe with red accents on a white background"
            draggable={false}
          />
        </ImageCard>
      </DraggableCanvasItem>
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
            {shoeFocused ? command.slice(0, visibleCount) : command}
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
  const compactShoeRef = useRef<HTMLDivElement>(null);
  const smileyRef = useRef<SVGSVGElement>(null);
  const [focusRequest, setFocusRequest] = useState(0);
  const [compactViewport, setCompactViewport] = useState(false);
  const [variantStatus, setVariantStatus] = useState<"idle" | "left-loading" | "left-ready" | "right-loading" | "ready">("idle");
  const [selectedImage, setSelectedImage] = useState<"shoe" | "left" | "right" | "pie" | "smiley" | null>(null);
  const [stackOrder, setStackOrder] = useState<StackCard[]>(["shoe", "left", "right"]);
  const [focusLayout, setFocusLayout] = useState({ copyShift: 0, shoeTop: 0, minHeight: 520 });
  const shoeFocused = focusRequest > 0;

  // Selected or newly added cards move to the top of the compact stack.
  const selectCard = (card: StackCard) => {
    setSelectedImage(card);
    setStackOrder((current) =>
      current[current.length - 1] === card ? current : [...current.filter((item) => item !== card), card],
    );
  };
  const stackStyle = (card: StackCard) => ({ "--stack-z": 3 + stackOrder.indexOf(card) }) as CSSProperties;
  const shoeImageUrl = useBaseUrl("/img/red_running_shoe_3.jpg");
  const leftVariantUrl = useBaseUrl("/img/red_running_shoe_variant_1.jpg");
  const rightVariantUrl = useBaseUrl("/img/red_running_shoe_variant_2.jpg");

  useEffect(() => {
    const breakpoint = window.matchMedia("(max-width: 1199px)");
    const updateViewport = () => setCompactViewport(breakpoint.matches);
    updateViewport();
    breakpoint.addEventListener("change", updateViewport);
    return () => breakpoint.removeEventListener("change", updateViewport);
  }, []);

  useLayoutEffect(() => {
    const svg = smileyRef.current;
    const item = svg?.parentElement;
    if (!svg || !item) return;
    const bounds = svg.getBBox();
    const viewBox = svg.viewBox.baseVal;
    const strokePadding = Number(svg.getAttribute("stroke-width")) / 2;
    item.style.setProperty("--smiley-selection-left", `${(bounds.x - strokePadding - viewBox.x) / viewBox.width * 100}%`);
    item.style.setProperty("--smiley-selection-top", `${(bounds.y - strokePadding - viewBox.y) / viewBox.height * 100}%`);
    item.style.setProperty("--smiley-selection-width", `${(bounds.width + strokePadding * 2) / viewBox.width * 100}%`);
    item.style.setProperty("--smiley-selection-height", `${(bounds.height + strokePadding * 2) / viewBox.height * 100}%`);
  }, []);

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
    const wrapper = wrapperRef.current;
    const canvas = canvasRef.current;
    const copy = copyRef.current;
    const inner = copyInnerRef.current;
    const desktopShoe = shoeRef.current;
    const compactShoe = compactShoeRef.current;
    const nav = navRef.current;
    const chat = wrapper?.querySelector<HTMLElement>(`.${styles.chatDock}`);
    const toggle = inner?.querySelector<HTMLElement>(`.${styles.canvasToggle}`);
    if (!canvas || !copy || !inner || !desktopShoe || !compactShoe || !nav || !chat || !toggle) {
      return;
    }
    const updateLayout = () => {
      const shoe = desktopShoe.offsetWidth > 0 ? desktopShoe : compactShoe;
      const copyTop = copy.offsetTop + inner.offsetTop;
      const toggleGap = parseFloat(getComputedStyle(toggle).bottom) - inner.offsetHeight;
      const raisedTop = nav.offsetTop + nav.offsetHeight + toggle.offsetHeight + toggleGap + 16;
      const copyShift = shoeFocused && !compactViewport ? copyTop - raisedTop : 0;
      const availableTop = copyTop - copyShift + inner.offsetHeight + 24;
      const chatTop = canvas.clientHeight - parseFloat(getComputedStyle(chat).bottom) - chat.offsetHeight * 0.85;
      const availableBottom = chatTop - 24;
      const minHeight = availableTop + shoe.offsetHeight + 24
        + chat.offsetHeight * 0.85 + parseFloat(getComputedStyle(chat).bottom);
      const shoeTop = (availableTop + availableBottom) / 2;
      setFocusLayout({ copyShift, shoeTop, minHeight });
    };
    updateLayout();
    const observer = new ResizeObserver(updateLayout);
    [canvas, inner, desktopShoe, compactShoe, nav, chat, toggle].forEach((element) => observer.observe(element));
    let resizeFrame = 0;
    const updateAfterResize = () => {
      window.cancelAnimationFrame(resizeFrame);
      resizeFrame = window.requestAnimationFrame(updateLayout);
    };
    window.addEventListener("resize", updateAfterResize);
    return () => {
      observer.disconnect();
      window.cancelAnimationFrame(resizeFrame);
      window.removeEventListener("resize", updateAfterResize);
    };
  }, [shoeFocused, focusRequest, compactViewport]);

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
    <div
      ref={wrapperRef}
      onPointerDownCapture={() => {
        if (!isPhoneViewport()) setSelectedImage(null);
      }}
      onClickCapture={(event) => {
        if (!isPhoneViewport() && event.target instanceof Element && !event.target.closest(`.${styles.draggableItem}`)) {
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
          <Link href="https://github.com/kasual1/kritzel" aria-label="GitHub" className={styles.topNavIcon}>
            <GitHubIcon />
          </Link>
          <MenuButton />
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
            <p className={styles.heroSubtitle} hidden={shoeFocused && !compactViewport}>
              Kritzel is framework-agnostic canvas library that helps you build agentic whiteboard
              experiences with React, Vue and Angular.
            </p>
            <CallToActionBar docsPath={docsPath} />
          </div>
        </div>

        <div className={styles.canvasLayer}>
          {variantStatus !== "idle" && (
            <>
              <div className={`${styles.variantPlaceholder} ${styles.variantPlaceholderLeft}`} style={stackStyle("left")}>
                <DraggableCanvasItem
                  label="casual shoe variant"
                  selected={selectedImage === "left"}
                  onSelect={() => selectCard("left")}
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
              <div className={`${styles.variantPlaceholder} ${styles.variantPlaceholderRight}`} style={stackStyle("right")}>
                <DraggableCanvasItem
                  label="summer shoe variant"
                  selected={selectedImage === "right"}
                  onSelect={() => selectCard("right")}
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
          <RunningShoe
            anchorRef={shoeRef}
            className={styles.shoeDesktop}
            imageUrl={shoeImageUrl}
            focused={shoeFocused}
            selected={selectedImage === "shoe"}
            onSelect={() => selectCard("shoe")}
          />
          <RunningShoe
            anchorRef={compactShoeRef}
            className={styles.shoeCompact}
            imageUrl={shoeImageUrl}
            focused={shoeFocused}
            selected={selectedImage === "shoe"}
            onSelect={() => selectCard("shoe")}
            style={stackStyle("shoe")}
          />
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
                ref={smileyRef}
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
          shoeFocused={shoeFocused || compactViewport}
          command={!shoeFocused && !compactViewport ? INITIAL_COMMAND : variantStatus === "idle" || variantStatus === "left-loading" ? CASUAL_COMMAND : SUMMER_COMMAND}
          canReset={variantStatus === "right-loading" || variantStatus === "ready"}
          onSubmit={() => {
            if (variantStatus === "left-ready") {
              selectCard("right");
              setVariantStatus("right-loading");
            } else if ((shoeFocused || compactViewport) && variantStatus === "idle") {
              if (!shoeFocused) setFocusRequest((current) => current + 1);
              selectCard("left");
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
