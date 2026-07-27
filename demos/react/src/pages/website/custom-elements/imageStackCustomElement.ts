import { KritzelCustomElement } from "kritzel-react";
import { KritzelCustomElementRendererRegistry } from "kritzel-stencil";

export const IMAGE_STACK_RENDERER_KEY = "website-hero-image-stack";
export const IMAGE_STACK_OBJECT_SIZE = 364;
const IMAGE_STACK_Z_INDEX = 13;
const normalizedBaseUrl = import.meta.env.BASE_URL.endsWith("/")
  ? import.meta.env.BASE_URL
  : `${import.meta.env.BASE_URL}/`;

function withBaseUrl(assetPath: string): string {
  return `${normalizedBaseUrl}${assetPath.replace(/^\/+/, "")}`;
}

type PlaceholderImage = {
  id: string;
  label: string;
  url: string;
};

type ImageStackState = {
  currentIndex: number;
};

type MountedImageStack = {
  root: HTMLElement;
  getState: () => ImageStackState;
  destroy: () => void;
};

const IMAGE_POOL: PlaceholderImage[] = [
  { id: "img-3", label: "Mars", url: withBaseUrl("image_stack_1.png") },
  { id: "img-2", label: "Moon", url: withBaseUrl("image_stack_2.png") },
  { id: "img-1", label: "ISS", url: withBaseUrl("image_stack_3.png") },
  { id: "img-4", label: "Uranus", url: withBaseUrl("image_stack_4.png") },
];

export function createImageStackInitialState(): ImageStackState {
  return {
    currentIndex: 0,
  };
}

function normalizeImageStackState(data: unknown): ImageStackState {
  const fallback = createImageStackInitialState();
  const maxIndex = Math.max(0, IMAGE_POOL.length - 1);

  if (!data || typeof data !== "object") {
    return fallback;
  }

  const candidate = data as Partial<ImageStackState>;
  const currentIndex =
    typeof candidate.currentIndex === "number"
      ? Math.min(Math.max(0, Math.floor(candidate.currentIndex)), maxIndex)
      : fallback.currentIndex;

  return { currentIndex };
}

function mountImageStackWidget(initialState: ImageStackState): MountedImageStack {
  const state = normalizeImageStackState(initialState);
  const root = document.createElement("section");
  root.style.cssText = [
    "height:100%",
    "width:100%",
    "box-sizing:border-box",
    "background:transparent",
    "font-family:'Segoe UI', Tahoma, sans-serif",
    "display:grid",
    "place-items:center",
    "padding:0",
    "overflow:visible",
    "color:#202634",
  ].join(";");

  const shell = document.createElement("div");
  shell.style.cssText = [
    "position:relative",
    "width:100%",
    "height:100%",
    "min-width:0",
    "min-height:0",
  ].join(";");

  const stage = document.createElement("div");
  stage.style.cssText = [
    "position:relative",
    "width:100%",
    "height:100%",
    "border-radius:clamp(20px, 10%, 44px)",
    "background:#f4f7fb",
    "overflow:hidden",
    "box-shadow:0 14px 30px rgba(20, 29, 46, 0.2)",
  ].join(";");

  const indexBadge = document.createElement("div");
  indexBadge.style.cssText =
    "position:absolute; right:18px; bottom:18px; z-index:3; background:rgba(19, 29, 45, 0.58); color:#fff; font-size:12px; font-weight:600; border-radius:999px; padding:4px 9px;";

  const titleBadge = document.createElement("div");
  titleBadge.style.cssText =
    "position:absolute; left:18px; right:18px; bottom:18px; z-index:2; color:#ffffff; font-size:13px; font-weight:600; letter-spacing:0.01em; text-shadow:0 2px 8px rgba(10, 15, 24, 0.45); overflow:hidden; white-space:nowrap; text-overflow:ellipsis; padding-right:72px;";

  const buttonBaseStyle = [
    "position:absolute",
    "top:50%",
    "z-index:10",
    "width:48px",
    "height:48px",
    "transform:translateY(-50%)",
    "border:1px solid rgba(255, 255, 255, 0.45)",
    "border-radius:999px",
    "background:rgba(12, 18, 28, 0.5)",
    "color:#ffffff",
    "cursor:pointer",
    "font-family:Georgia, serif",
    "font-size:34px",
    "font-weight:400",
    "line-height:1",
    "display:grid",
    "place-items:center",
    "padding:0 0 4px",
    "backdrop-filter:blur(10px)",
    "touch-action:manipulation",
    "user-select:none",
    "-webkit-tap-highlight-color:transparent",
    "box-shadow:0 6px 18px rgba(4, 8, 15, 0.25)",
  ].join(";");

  const prevButton = document.createElement("button");
  prevButton.type = "button";
  prevButton.textContent = "‹";
  prevButton.setAttribute("aria-label", "Show previous image");
  prevButton.style.cssText = `${buttonBaseStyle}; left:18px;`;

  const nextButton = document.createElement("button");
  nextButton.type = "button";
  nextButton.textContent = "›";
  nextButton.setAttribute("aria-label", "Show next image");
  nextButton.style.cssText = `${buttonBaseStyle}; right:18px;`;

  const cleanupListeners: Array<() => void> = [];
  let previousIndex: number | null = null;

  function shiftIndex(step: number) {
    if (IMAGE_POOL.length === 0) {
      return;
    }

    previousIndex = state.currentIndex;
    state.currentIndex = (state.currentIndex + step + IMAGE_POOL.length) % IMAGE_POOL.length;
    render();
  }

  function clampIndex() {
    if (IMAGE_POOL.length === 0) {
      state.currentIndex = 0;
      return;
    }

    state.currentIndex = Math.min(state.currentIndex, IMAGE_POOL.length - 1);
  }

  function buildImageLayer(image: PlaceholderImage): HTMLDivElement {
    const layer = document.createElement("div");
    layer.style.cssText = [
      "position:absolute",
      "inset:0",
      "border-radius:inherit",
      "background-size:cover",
      "background-position:center",
      `background-image:url('${image.url}')`,
      "will-change:opacity, transform",
      "overflow:hidden",
    ].join(";");

    const shade = document.createElement("div");
    shade.style.cssText =
      "position:absolute; inset:0; pointer-events:none; background:linear-gradient(180deg, rgba(8, 12, 20, 0.04) 0%, rgba(8, 12, 20, 0.18) 55%, rgba(8, 12, 20, 0.56) 100%);";
    layer.appendChild(shade);

    return layer;
  }

  function render() {
    clampIndex();
    stage.innerHTML = "";

    if (IMAGE_POOL.length === 0) {
      const empty = document.createElement("div");
      empty.textContent = "No images configured";
      empty.style.cssText = "height:100%; display:grid; place-items:center; color:#7a8294; font-size:14px;";
      stage.appendChild(empty);
      indexBadge.textContent = "0 / 0";
      titleBadge.textContent = "";
      prevButton.disabled = true;
      nextButton.disabled = true;
      return;
    }

    const currentImage = IMAGE_POOL[state.currentIndex];
    const currentLayer = buildImageLayer(currentImage);
    currentLayer.style.zIndex = "1";
    stage.appendChild(currentLayer);

    if (previousIndex !== null && previousIndex !== state.currentIndex) {
      const previousLayer = buildImageLayer(IMAGE_POOL[previousIndex]);
      previousLayer.style.zIndex = "0";
      stage.insertBefore(previousLayer, currentLayer);

      previousLayer.animate(
        [
          { opacity: 1, transform: "scale(1)" },
          { opacity: 0, transform: "scale(0.985)" },
        ],
        {
          duration: 220,
          easing: "ease-out",
          fill: "both",
        },
      );

      currentLayer.animate(
        [
          { opacity: 0, transform: "scale(1.015)" },
          { opacity: 1, transform: "scale(1)" },
        ],
        {
          duration: 260,
          easing: "cubic-bezier(0.22, 0.73, 0.2, 1)",
          fill: "both",
        },
      );
    }

    stage.appendChild(titleBadge);
    stage.appendChild(indexBadge);
    stage.appendChild(prevButton);
    stage.appendChild(nextButton);
    indexBadge.textContent = `${state.currentIndex + 1} / ${IMAGE_POOL.length}`;
    titleBadge.textContent = currentImage.label;
    prevButton.disabled = IMAGE_POOL.length <= 1;
    nextButton.disabled = IMAGE_POOL.length <= 1;
    previousIndex = null;
  }

  const onPrev = () => {
    shiftIndex(-1);
  };

  const onNext = () => {
    shiftIndex(1);
  };

  const onPrevPointerDown = (event: PointerEvent) => {
    event.preventDefault();
    event.stopPropagation();
    shiftIndex(-1);
  };

  const onNextPointerDown = (event: PointerEvent) => {
    event.preventDefault();
    event.stopPropagation();
    shiftIndex(1);
  };

  const stopControlPointerEvent = (event: PointerEvent) => {
    event.stopPropagation();
  };

  const onPrevClick = (event: MouseEvent) => {
    if (event.detail === 0) {
      onPrev();
    }
  };

  const onNextClick = (event: MouseEvent) => {
    if (event.detail === 0) {
      onNext();
    }
  };

  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      shiftIndex(-1);
      return;
    }

    if (event.key === "ArrowRight") {
      event.preventDefault();
      shiftIndex(1);
    }
  };

  prevButton.addEventListener("pointerdown", onPrevPointerDown);
  prevButton.addEventListener("pointerup", stopControlPointerEvent);
  prevButton.addEventListener("click", onPrevClick);
  nextButton.addEventListener("pointerdown", onNextPointerDown);
  nextButton.addEventListener("pointerup", stopControlPointerEvent);
  nextButton.addEventListener("click", onNextClick);
  root.tabIndex = 0;
  root.setAttribute("aria-label", "Image stack viewer");
  root.addEventListener("keydown", onKeyDown);

  cleanupListeners.push(() => prevButton.removeEventListener("pointerdown", onPrevPointerDown));
  cleanupListeners.push(() => prevButton.removeEventListener("pointerup", stopControlPointerEvent));
  cleanupListeners.push(() => prevButton.removeEventListener("click", onPrevClick));
  cleanupListeners.push(() => nextButton.removeEventListener("pointerdown", onNextPointerDown));
  cleanupListeners.push(() => nextButton.removeEventListener("pointerup", stopControlPointerEvent));
  cleanupListeners.push(() => nextButton.removeEventListener("click", onNextClick));
  cleanupListeners.push(() => root.removeEventListener("keydown", onKeyDown));

  shell.appendChild(stage);
  root.appendChild(shell);

  render();

  return {
    root,
    getState: () => ({
      currentIndex: state.currentIndex,
    }),
    destroy: () => {
      cleanupListeners.forEach((cleanup) => cleanup());
    },
  };
}

export function setupImageStackRenderer() {
  const mountedWidgets = new Map<string, MountedImageStack>();

  KritzelCustomElementRendererRegistry.register(IMAGE_STACK_RENDERER_KEY, {
    onMount: ({ object, container, data }) => {
      if (!container) {
        return;
      }

      object.isResizable = true;
      object.isRotatable = false;
      object.zIndex = IMAGE_STACK_Z_INDEX;

      // Ensure the custom-element mount container does not clip stage shadows.
      container.style.overflow = "visible";

      const previousWidget = mountedWidgets.get(object.id);
      if (previousWidget) {
        previousWidget.destroy();
        previousWidget.root.remove();
        mountedWidgets.delete(object.id);
      }

      const mountedWidget = mountImageStackWidget(normalizeImageStackState(data));
      container.innerHTML = "";
      container.appendChild(mountedWidget.root);
      requestAnimationFrame(() => {
        const objectElement = container.closest<HTMLElement>(".object");
        if (objectElement) {
          objectElement.style.zIndex = `${IMAGE_STACK_Z_INDEX}`;
        }
      });
      object.setIsInteractive(true);
      mountedWidgets.set(object.id, mountedWidget);
    },
    onUnmount: ({ object, container }) => {
      const mountedWidget = mountedWidgets.get(object.id);
      if (!mountedWidget) {
        return undefined;
      }

      const snapshot = mountedWidget.getState();
      mountedWidget.destroy();
      mountedWidget.root.remove();
      mountedWidgets.delete(object.id);

      if (container) {
        container.innerHTML = "";
      }

      return snapshot;
    },
  });

  return () => {
    mountedWidgets.forEach((widget) => {
      widget.destroy();
      widget.root.remove();
    });
    mountedWidgets.clear();
    KritzelCustomElementRendererRegistry.unregister(IMAGE_STACK_RENDERER_KEY);
  };
}

export function createImageStackCustomElement() {
  const imagePlaceholder = document.createElement("div");
  imagePlaceholder.textContent = "Loading Image Stack...";

  const imageStackElement = new KritzelCustomElement({
    element: imagePlaceholder,
    rendererKey: IMAGE_STACK_RENDERER_KEY,
    rendererData: createImageStackInitialState(),
    translateX: 325,
    translateY: -480,
    width: IMAGE_STACK_OBJECT_SIZE,
    height: IMAGE_STACK_OBJECT_SIZE,
  });

  imageStackElement.isRotatable = false;
  imageStackElement.isResizable = true;
  imageStackElement.zIndex = IMAGE_STACK_Z_INDEX;

  return imageStackElement;
}
