import { CSSProperties, useEffect, useRef } from "react";
import {
  KritzelCustomElement,
  KritzelEditor,
  type HTMLKritzelEditorElement,
} from "kritzel-react";
import { KritzelCustomElementRendererRegistry } from "kritzel-stencil";

const hostStyle: CSSProperties = {
  display: "block",
  height: "100%",
};

const ROCKET_TODO_RENDERER_KEY = "website-hero-rocket-todo";
const IMAGE_STACK_RENDERER_KEY = "website-hero-image-stack";

type RocketTodoItem = {
  id: string;
  title: string;
  isChecked: boolean;
};

type RocketTodoState = {
  items: RocketTodoItem[];
};

type MountedRocketTodo = {
  root: HTMLElement;
  getState: () => RocketTodoState;
  destroy: () => void;
};

type PlaceholderImage = {
  id: string;
  label: string;
  url: string;
};

type ImageStackState = {
  selectedImageIds: string[];
  currentIndex: number;
};

type MountedImageStack = {
  root: HTMLElement;
  getState: () => ImageStackState;
  destroy: () => void;
};

const DEFAULT_ROCKET_TODO_STATE: RocketTodoState = {
  items: [
    { id: "fuel", title: "Confirm propellant tanks are filled and pressure-stable", isChecked: false },
    { id: "telemetry", title: "Verify live telemetry stream from all critical sensors", isChecked: false },
    { id: "weather", title: "Approve weather and lightning window for launch corridor", isChecked: false },
    { id: "range", title: "Receive final range safety clearance and abort readiness", isChecked: false },
    { id: "crew", title: "Run final crew and mission control communication check", isChecked: false },
  ],
};

const CATEGORY_LABEL_BY_ID: Record<string, string> = {
  fuel: "Propulsion #",
  telemetry: "Systems #",
  weather: "Weather #",
  range: "Safety #",
  crew: "Crew #",
};

const IMAGE_POOL: PlaceholderImage[] = [
  { id: "img-1", label: "Falcon", url: "https://picsum.photos/id/1011/1200/800" },
  { id: "img-2", label: "Atlas", url: "https://picsum.photos/id/1015/1200/800" },
  { id: "img-3", label: "Orion", url: "https://picsum.photos/id/1016/1200/800" },
  { id: "img-4", label: "Nova", url: "https://picsum.photos/id/1025/1200/800" },
  { id: "img-5", label: "Astra", url: "https://picsum.photos/id/1033/1200/800" },
  { id: "img-6", label: "Helios", url: "https://picsum.photos/id/1043/1200/800" },
];

function cloneRocketTodoState(state: RocketTodoState): RocketTodoState {
  return {
    items: state.items.map((item) => ({ ...item })),
  };
}

function createRocketTodoInitialState(): RocketTodoState {
  return cloneRocketTodoState(DEFAULT_ROCKET_TODO_STATE);
}

function createImageStackInitialState(): ImageStackState {
  return {
    selectedImageIds: IMAGE_POOL.slice(0, 5).map((image) => image.id),
    currentIndex: 0,
  };
}

function normalizeRocketTodoState(data: unknown): RocketTodoState {
  if (!data || typeof data !== "object") {
    return createRocketTodoInitialState();
  }

  const candidate = data as Partial<RocketTodoState>;
  if (!Array.isArray(candidate.items)) {
    return createRocketTodoInitialState();
  }

  const baseItems = DEFAULT_ROCKET_TODO_STATE.items;
  const nextItems = baseItems.map((baseItem) => {
    const match = candidate.items?.find((item) => item?.id === baseItem.id);
    return {
      ...baseItem,
      isChecked: typeof match?.isChecked === "boolean" ? match.isChecked : baseItem.isChecked,
    };
  });

  return { items: nextItems };
}

function normalizeImageStackState(data: unknown): ImageStackState {
  const fallback = createImageStackInitialState();
  if (!data || typeof data !== "object") {
    return fallback;
  }

  const candidate = data as Partial<ImageStackState>;
  const selectedImageIds = Array.isArray(candidate.selectedImageIds)
    ? candidate.selectedImageIds.filter((id): id is string => IMAGE_POOL.some((image) => image.id === id))
    : fallback.selectedImageIds;

  const safeSelected = selectedImageIds.length > 0 ? selectedImageIds : fallback.selectedImageIds;
  const maxIndex = Math.max(0, safeSelected.length - 1);
  const normalizedIndex =
    typeof candidate.currentIndex === "number"
      ? Math.min(Math.max(0, Math.floor(candidate.currentIndex)), maxIndex)
      : 0;

  return {
    selectedImageIds: [...new Set(safeSelected)],
    currentIndex: normalizedIndex,
  };
}

function getSelectedImages(selectedImageIds: string[]): PlaceholderImage[] {
  const selectedSet = new Set(selectedImageIds);
  return IMAGE_POOL.filter((image) => selectedSet.has(image.id));
}

function mountRocketTodoWidget(initialState: RocketTodoState): MountedRocketTodo {
  const state = cloneRocketTodoState(initialState);

  const root = document.createElement("section");
  root.style.cssText = [
    "height:100%",
    "box-sizing:border-box",
    "border-radius:14px",
    "border:12px solid #e4e7eb",
    "background:#ffffff",
    "font-family:'Segoe UI', Tahoma, sans-serif",
    "display:flex",
    "flex-direction:column",
    "overflow:hidden",
    "color:#22252a",
  ].join(";");

  const header = document.createElement("div");
  header.style.cssText = "padding:16px 16px 12px; border-bottom:1px solid #efeff0;";

  const heading = document.createElement("h2");
  heading.textContent = "Today";
  heading.style.cssText = "margin:0; font-size:38px; line-height:1; font-weight:700; letter-spacing:-0.03em;";

  const subheading = document.createElement("p");
  subheading.textContent = "Rocket Launch Tasks 5";
  subheading.style.cssText = "margin:10px 0 0; color:#5f646d; font-size:14px; font-weight:600;";

  const list = document.createElement("ul");
  list.style.cssText = "margin:0; padding:0; list-style:none; overflow:auto; border-radius:14px;";

  const listeners: Array<() => void> = [];

  state.items.forEach((item) => {
    const row = document.createElement("li");
    row.style.cssText =
      "display:grid; grid-template-columns:auto 1fr auto; align-items:center; gap:10px; padding:13px 16px; border-bottom:1px solid #efeff0; background:#ffffff;";

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = item.isChecked;
    checkbox.style.cssText = [
      "inline-size:22px",
      "block-size:22px",
      "margin:0",
      "cursor:pointer",
      "appearance:none",
      "-webkit-appearance:none",
      "border:1.5px solid #c5c8cf",
      "border-radius:999px",
      "background:#ffffff",
      "display:inline-grid",
      "place-content:center",
      "transition:all 0.16s ease",
    ].join(";");

    const textWrap = document.createElement("div");
    textWrap.style.cssText = "min-width:0;";

    const label = document.createElement("span");
    label.textContent = item.title;
    label.style.cssText = "display:block; font-size:16px; line-height:1.3; color:#262a33;";

    const meta = document.createElement("span");
    meta.textContent = "Required before launch";
    meta.style.cssText = "display:block; margin-top:3px; color:#66a443; font-size:13px;";

    const category = document.createElement("span");
    category.textContent = CATEGORY_LABEL_BY_ID[item.id] ?? "Launch #";
    category.style.cssText = "font-size:13px; color:#80858f; white-space:nowrap;";

    const applyCheckedStyle = () => {
      checkbox.style.backgroundColor = checkbox.checked ? "#007AFF" : "#ffffff";
      checkbox.style.borderColor = checkbox.checked ? "#007AFF" : "#c5c8cf";
      checkbox.style.backgroundImage = checkbox.checked
        ? 'url("data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 viewBox=%270 0 20 20%27%3E%3Cpath d=%27M5 10.5l3.1 3.2L15.3 6.8%27 fill=%27none%27 stroke=%27white%27 stroke-width=%272.3%27 stroke-linecap=%27round%27 stroke-linejoin=%27round%27/%3E%3C/svg%3E")'
        : "none";
      checkbox.style.backgroundRepeat = "no-repeat";
      checkbox.style.backgroundPosition = "center";
      checkbox.style.backgroundSize = "15px 15px";
      label.style.textDecoration = checkbox.checked ? "line-through" : "none";
      label.style.color = checkbox.checked ? "#878d98" : "#262a33";
      meta.style.color = checkbox.checked ? "#9aa29f" : "#66a443";
      row.style.backgroundColor = checkbox.checked ? "#fcfcfc" : "#ffffff";
    };

    applyCheckedStyle();

    const onToggle = () => {
      item.isChecked = checkbox.checked;
      applyCheckedStyle();
    };

    checkbox.addEventListener("change", onToggle);
    listeners.push(() => checkbox.removeEventListener("change", onToggle));

    textWrap.appendChild(label);
    textWrap.appendChild(meta);

    row.appendChild(checkbox);
    row.appendChild(textWrap);
    row.appendChild(category);
    list.appendChild(row);
  });

  header.appendChild(heading);
  header.appendChild(subheading);
  root.appendChild(header);
  root.appendChild(list);

  return {
    root,
    getState: () => cloneRocketTodoState(state),
    destroy: () => {
      listeners.forEach((cleanup) => cleanup());
    },
  };
}

function mountImageStackWidget(initialState: ImageStackState): MountedImageStack {
  const state = normalizeImageStackState(initialState);
  const root = document.createElement("section");
  root.style.cssText = [
    "height:100%",
    "box-sizing:border-box",
    "border-radius:14px",
    "background:transparent",
    "font-family:'Segoe UI', Tahoma, sans-serif",
    "display:grid",
    "place-items:center",
    "padding:8px",
    "overflow:visible",
    "color:#202634",
  ].join(";");

  const stage = document.createElement("div");
  stage.style.cssText = [
    "position:relative",
    "width:320px",
    "height:320px",
    "border-radius:14px",
    "background:#f4f7fb",
    "touch-action:pan-y",
    "overflow:hidden",
    "box-shadow:0 10px 22px rgba(20, 29, 46, 0.14)",
    "perspective:900px",
  ].join(";");

  const indexBadge = document.createElement("div");
  indexBadge.style.cssText =
    "position:absolute; inset:auto 10px 10px auto; z-index:20; background:rgba(19, 29, 45, 0.58); color:#fff; font-size:12px; font-weight:600; border-radius:999px; padding:4px 9px;";

  const buttonBaseStyle = [
    "position:absolute",
    "top:50%",
    "transform:translateY(-50%)",
    "z-index:20",
    "width:36px",
    "height:36px",
    "border:none",
    "border-radius:999px",
    "background:rgba(16, 24, 38, 0.48)",
    "color:#ffffff",
    "cursor:pointer",
    "font-size:18px",
    "line-height:1",
    "display:grid",
    "place-items:center",
    "backdrop-filter:blur(2px)",
  ].join(";");

  const prevButton = document.createElement("button");
  prevButton.type = "button";
  prevButton.textContent = "‹";
  prevButton.style.cssText = `${buttonBaseStyle}; left:10px;`;

  const nextButton = document.createElement("button");
  nextButton.type = "button";
  nextButton.textContent = "›";
  nextButton.style.cssText = `${buttonBaseStyle}; right:10px;`;

  const expandButton = document.createElement("button");
  expandButton.type = "button";
  expandButton.textContent = "▦";
  expandButton.setAttribute("aria-label", "Toggle image grid");
  expandButton.style.cssText =
    "position:absolute; top:10px; right:10px; z-index:22; width:34px; height:34px; border:none; border-radius:10px; background:rgba(16, 24, 38, 0.48); color:#ffffff; cursor:pointer; font-size:16px; line-height:1; display:grid; place-items:center; backdrop-filter:blur(2px);";

  const cleanupListeners: Array<() => void> = [];

  let startX = 0;
  let isPointerDown = false;
  let lastDirection: "forward" | "backward" | null = null;
  let previousImageForTransition: PlaceholderImage | null = null;
  let isExpanded = false;

  function getCurrentImages(): PlaceholderImage[] {
    return getSelectedImages(state.selectedImageIds);
  }

  function shiftIndex(step: number) {
    const images = getCurrentImages();
    if (images.length === 0) {
      return;
    }

    previousImageForTransition = images[state.currentIndex];
    lastDirection = step > 0 ? "forward" : "backward";
    state.currentIndex = (state.currentIndex + step + images.length) % images.length;
    render();
  }

  function clampIndex() {
    const images = getCurrentImages();
    if (images.length === 0) {
      state.currentIndex = 0;
      return;
    }

    state.currentIndex = Math.min(state.currentIndex, images.length - 1);
  }

  function buildImageCard(image: PlaceholderImage): HTMLDivElement {
    const card = document.createElement("div");
    card.style.cssText = [
      "position:absolute",
      "inset:0",
      "border-radius:14px",
      "background-size:cover",
      "background-position:center",
      `background-image:url('${image.url}')`,
      "transition:opacity 0.22s ease",
      "backface-visibility:hidden",
      "transform-style:preserve-3d",
      "will-change:transform, opacity",
      "overflow:hidden",
    ].join(";");

    const shade = document.createElement("div");
    shade.style.cssText =
      "position:absolute; inset:0; pointer-events:none; opacity:0; background:linear-gradient(90deg, rgba(7, 12, 22, 0.42) 0%, rgba(7, 12, 22, 0.1) 42%, rgba(7, 12, 22, 0) 100%);";
    card.appendChild(shade);

    return card;
  }

  function animateCardFlip(outgoingCard: HTMLDivElement, incomingCard: HTMLDivElement) {
    if (!lastDirection) {
      return;
    }

    const isForward = lastDirection === "forward";
    const outgoingShade = outgoingCard.firstElementChild as HTMLDivElement | null;
    const incomingShade = incomingCard.firstElementChild as HTMLDivElement | null;

    outgoingCard.style.transformOrigin = isForward ? "left center" : "right center";
    incomingCard.style.transformOrigin = isForward ? "right center" : "left center";

    outgoingCard.animate(
      [
        {
          opacity: 1,
          transform: "rotateY(0deg) translateX(0) scale(1)",
        },
        {
          opacity: 0.9,
          transform: isForward
            ? "rotateY(-72deg) translateX(-4%) scale(0.98)"
            : "rotateY(72deg) translateX(4%) scale(0.98)",
        },
      ],
      {
        duration: 430,
        easing: "cubic-bezier(0.19, 0.72, 0.2, 1)",
        fill: "both",
      },
    );

    incomingCard.animate(
      [
        {
          opacity: 0.88,
          transform: isForward
            ? "rotateY(72deg) translateX(4%) scale(0.98)"
            : "rotateY(-72deg) translateX(-4%) scale(0.98)",
        },
        {
          opacity: 1,
          transform: "rotateY(0deg) translateX(0) scale(1)",
        },
      ],
      {
        duration: 430,
        easing: "cubic-bezier(0.19, 0.72, 0.2, 1)",
        fill: "both",
      },
    );

    if (outgoingShade) {
      outgoingShade.animate(
        [{ opacity: 0 }, { opacity: 0.38 }],
        { duration: 430, easing: "ease-out", fill: "both" },
      );
    }

    if (incomingShade) {
      incomingShade.animate(
        [{ opacity: 0.36 }, { opacity: 0 }],
        { duration: 430, easing: "ease-out", fill: "both" },
      );
    }
  }

  function buildGridThumbnail(image: PlaceholderImage, index: number, total: number): HTMLButtonElement {
    const thumb = document.createElement("button");
    thumb.type = "button";
    thumb.style.cssText = [
      "border:none",
      "padding:0",
      "margin:0",
      "border-radius:10px",
      "cursor:pointer",
      "overflow:hidden",
      "position:relative",
      "background:#e6ebf2",
      "box-shadow:0 4px 12px rgba(20, 31, 47, 0.18)",
      "transform-origin:center",
    ].join(";");

    const imageLayer = document.createElement("div");
    imageLayer.style.cssText = [
      "position:absolute",
      "inset:0",
      `background-image:url('${image.url}')`,
      "background-size:cover",
      "background-position:center",
    ].join(";");

    const overlay = document.createElement("div");
    overlay.style.cssText =
      "position:absolute; inset:auto 0 0 0; padding:6px 7px; background:linear-gradient(180deg, rgba(8,14,24,0) 0%, rgba(8,14,24,0.7) 100%); color:#fff; font-size:11px; text-align:left;";
    overlay.textContent = `${index + 1} / ${total}`;

    thumb.appendChild(imageLayer);
    thumb.appendChild(overlay);

    return thumb;
  }

  function animateGridFanOut(gridItems: HTMLButtonElement[]) {
    gridItems.forEach((item, index) => {
      const rotation = (index % 2 === 0 ? -1 : 1) * 8;
      item.animate(
        [
          {
            opacity: 0,
            transform: `translateY(18px) scale(0.74) rotate(${rotation}deg)`,
          },
          {
            opacity: 1,
            transform: "translateY(0) scale(1) rotate(0deg)",
          },
        ],
        {
          duration: 300,
          delay: index * 28,
          easing: "cubic-bezier(0.2, 0.75, 0.22, 1)",
          fill: "both",
        },
      );
    });
  }

  const onResize = () => {
    const side = Math.floor(Math.min(root.clientWidth - 16, root.clientHeight - 16));
    const safeSide = Math.max(120, side);
    stage.style.width = `${safeSide}px`;
    stage.style.height = `${safeSide}px`;
  };

  const resizeObserver = new ResizeObserver(() => {
    onResize();
  });

  resizeObserver.observe(root);
  cleanupListeners.push(() => resizeObserver.disconnect());

  function render() {
    clampIndex();

    const images = getCurrentImages();
    stage.innerHTML = "";
    stage.style.boxShadow = isExpanded ? "none" : "0 10px 22px rgba(20, 29, 46, 0.14)";
    stage.style.background = isExpanded ? "transparent" : "#f4f7fb";

    if (images.length === 0) {
      const empty = document.createElement("div");
      empty.textContent = "No images configured";
      empty.style.cssText = "height:100%; display:grid; place-items:center; color:#7a8294; font-size:14px;";
      stage.appendChild(empty);
      indexBadge.textContent = "0 / 0";
      stage.appendChild(indexBadge);
      stage.appendChild(prevButton);
      stage.appendChild(nextButton);
      stage.appendChild(expandButton);
      return;
    }

    if (isExpanded) {
      const grid = document.createElement("div");
      grid.style.cssText =
        "position:absolute; inset:0; display:grid; grid-template-columns:repeat(2, minmax(0, 1fr)); gap:10px; padding:12px; background:transparent; backdrop-filter:none; z-index:14;";

      const gridItems = images.map((image, index) => {
        const thumb = buildGridThumbnail(image, index, images.length);
        if (index === state.currentIndex) {
          thumb.style.outline = "2px solid #007AFF";
        }

        const onSelect = () => {
          state.currentIndex = index;
          isExpanded = false;
          previousImageForTransition = null;
          lastDirection = null;
          render();
        };

        thumb.addEventListener("click", onSelect, { once: true });
        grid.appendChild(thumb);
        return thumb;
      });

      stage.appendChild(grid);
      stage.appendChild(expandButton);
      expandButton.textContent = "✕";
      expandButton.style.zIndex = "22";
      indexBadge.textContent = `${state.currentIndex + 1} / ${images.length}`;
      animateGridFanOut(gridItems);
      return;
    }

    const currentImage = images[state.currentIndex];
    const incomingCard = buildImageCard(currentImage);
    incomingCard.style.zIndex = "6";

    const shouldAnimateFlip =
      !!lastDirection && !!previousImageForTransition && previousImageForTransition.id !== currentImage.id;

    if (shouldAnimateFlip && previousImageForTransition) {
      const outgoingCard = buildImageCard(previousImageForTransition);
      outgoingCard.style.zIndex = "5";
      stage.appendChild(outgoingCard);
      stage.appendChild(incomingCard);
      animateCardFlip(outgoingCard, incomingCard);
    } else {
      stage.appendChild(incomingCard);
    }

    stage.appendChild(indexBadge);
    stage.appendChild(prevButton);
    stage.appendChild(nextButton);
    stage.appendChild(expandButton);

    indexBadge.textContent = `${state.currentIndex + 1} / ${images.length}`;
    expandButton.textContent = "▦";
    previousImageForTransition = null;
    lastDirection = null;
  }

  const onPrev = () => {
    shiftIndex(-1);
  };

  const onNext = () => {
    shiftIndex(1);
  };

  const onPointerDown = (event: PointerEvent) => {
    if (isExpanded) {
      return;
    }

    isPointerDown = true;
    startX = event.clientX;
  };

  const onPointerUp = (event: PointerEvent) => {
    if (!isPointerDown) {
      return;
    }

    const deltaX = event.clientX - startX;
    isPointerDown = false;

    if (Math.abs(deltaX) < 35) {
      return;
    }

    if (deltaX > 0) {
      shiftIndex(-1);
      return;
    }

    shiftIndex(1);
  };

  const onPointerCancel = () => {
    isPointerDown = false;
  };

  const onToggleExpanded = () => {
    isExpanded = !isExpanded;
    render();
  };

  prevButton.addEventListener("click", onPrev);
  nextButton.addEventListener("click", onNext);
  expandButton.addEventListener("click", onToggleExpanded);
  stage.addEventListener("pointerdown", onPointerDown);
  stage.addEventListener("pointerup", onPointerUp);
  stage.addEventListener("pointercancel", onPointerCancel);

  cleanupListeners.push(() => prevButton.removeEventListener("click", onPrev));
  cleanupListeners.push(() => nextButton.removeEventListener("click", onNext));
  cleanupListeners.push(() => expandButton.removeEventListener("click", onToggleExpanded));
  cleanupListeners.push(() => stage.removeEventListener("pointerdown", onPointerDown));
  cleanupListeners.push(() => stage.removeEventListener("pointerup", onPointerUp));
  cleanupListeners.push(() => stage.removeEventListener("pointercancel", onPointerCancel));

  root.appendChild(stage);

  onResize();
  render();

  return {
    root,
    getState: () => ({
      selectedImageIds: [...state.selectedImageIds],
      currentIndex: state.currentIndex,
    }),
    destroy: () => {
      cleanupListeners.forEach((cleanup) => cleanup());
    },
  };
}

export function WebsiteHeroPage() {
  const editorRef = useRef<HTMLKritzelEditorElement | null>(null);
  const hasAddedInitialCustomElement = useRef(false);
  const mountedTodoWidgets = useRef<Map<string, MountedRocketTodo>>(new Map());
  const mountedImageWidgets = useRef<Map<string, MountedImageStack>>(new Map());

  useEffect(() => {
    KritzelCustomElementRendererRegistry.register(ROCKET_TODO_RENDERER_KEY, {
      onMount: ({ object, container, data }) => {
        if (!container) {
          return;
        }

        const previousWidget = mountedTodoWidgets.current.get(object.id);
        if (previousWidget) {
          previousWidget.destroy();
          previousWidget.root.remove();
          mountedTodoWidgets.current.delete(object.id);
        }

        const mountedWidget = mountRocketTodoWidget(normalizeRocketTodoState(data));
        container.innerHTML = "";
        container.appendChild(mountedWidget.root);
        mountedTodoWidgets.current.set(object.id, mountedWidget);
      },
      onUnmount: ({ object, container }) => {
        const mountedWidget = mountedTodoWidgets.current.get(object.id);
        if (!mountedWidget) {
          return undefined;
        }

        const snapshot = mountedWidget.getState();
        mountedWidget.destroy();
        mountedWidget.root.remove();
        mountedTodoWidgets.current.delete(object.id);

        if (container) {
          container.innerHTML = "";
        }

        return snapshot;
      },
    });

    KritzelCustomElementRendererRegistry.register(IMAGE_STACK_RENDERER_KEY, {
      onMount: ({ object, container, data }) => {
        if (!container) {
          return;
        }

        const previousWidget = mountedImageWidgets.current.get(object.id);
        if (previousWidget) {
          previousWidget.destroy();
          previousWidget.root.remove();
          mountedImageWidgets.current.delete(object.id);
        }

        const mountedWidget = mountImageStackWidget(normalizeImageStackState(data));
        container.innerHTML = "";
        container.appendChild(mountedWidget.root);
        mountedImageWidgets.current.set(object.id, mountedWidget);
      },
      onUnmount: ({ object, container }) => {
        const mountedWidget = mountedImageWidgets.current.get(object.id);
        if (!mountedWidget) {
          return undefined;
        }

        const snapshot = mountedWidget.getState();
        mountedWidget.destroy();
        mountedWidget.root.remove();
        mountedImageWidgets.current.delete(object.id);

        if (container) {
          container.innerHTML = "";
        }

        return snapshot;
      },
    });

    return () => {
      mountedTodoWidgets.current.forEach((widget) => {
        widget.destroy();
        widget.root.remove();
      });
      mountedTodoWidgets.current.clear();

      mountedImageWidgets.current.forEach((widget) => {
        widget.destroy();
        widget.root.remove();
      });
      mountedImageWidgets.current.clear();

      KritzelCustomElementRendererRegistry.unregister(ROCKET_TODO_RENDERER_KEY);
      KritzelCustomElementRendererRegistry.unregister(IMAGE_STACK_RENDERER_KEY);
    };
  }, []);

  async function onReady() {
    if (hasAddedInitialCustomElement.current) {
      return;
    }

    const objectCount = await editorRef.current?.getObjectsTotalCount();
    if ((objectCount ?? 0) > 0) {
      return;
    }

    hasAddedInitialCustomElement.current = true;

    const placeholder = document.createElement("div");
    placeholder.textContent = "Loading Launch Checklist...";

    const customElement = new KritzelCustomElement({
      element: placeholder,
      rendererKey: ROCKET_TODO_RENDERER_KEY,
      rendererData: createRocketTodoInitialState(),
      translateX: -320,
      translateY: -190,
      width: 500,
      height: 380,
    });

    customElement.isRotatable = false;

    await editorRef.current?.addObject(customElement);

    const imagePlaceholder = document.createElement("div");
    imagePlaceholder.textContent = "Loading Image Stack...";

    const imageStackElement = new KritzelCustomElement({
      element: imagePlaceholder,
      rendererKey: IMAGE_STACK_RENDERER_KEY,
      rendererData: createImageStackInitialState(),
      translateX: 260,
      translateY: -190,
      width: 560,
      height: 380,
    });

    imageStackElement.isRotatable = false;

    await editorRef.current?.addObject(imageStackElement);
  }

  return (
    <div style={hostStyle}>
      <KritzelEditor
        ref={editorRef}
        editorId="website-hero"
        isPanningEnabled={false}
        isZoomingEnabled={true}
        isMoreMenuVisible={false}
        isWorkspaceManagerVisible={false}
        onIsReady={() => {
          void onReady();
        }}
      />
    </div>
  );
}