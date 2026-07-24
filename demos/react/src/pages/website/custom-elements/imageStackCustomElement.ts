import { KritzelCustomElement } from "kritzel-react";
import { KritzelCustomElementRendererRegistry } from "kritzel-stencil";

export const IMAGE_STACK_RENDERER_KEY = "website-hero-image-stack";
export const IMAGE_STACK_OBJECT_SIZE = 364;

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

const IMAGE_POOL: PlaceholderImage[] = [
  { id: "img-1", label: "Falcon", url: "https://picsum.photos/id/1011/1200/800" },
  { id: "img-2", label: "Atlas", url: "https://picsum.photos/id/1015/1200/800" },
  { id: "img-3", label: "Orion", url: "https://picsum.photos/id/1016/1200/800" },
  { id: "img-4", label: "Nova", url: "https://picsum.photos/id/1025/1200/800" },
  { id: "img-5", label: "Astra", url: "https://picsum.photos/id/1033/1200/800" },
  { id: "img-6", label: "Helios", url: "https://picsum.photos/id/1043/1200/800" },
];

export function createImageStackInitialState(): ImageStackState {
  return {
    selectedImageIds: IMAGE_POOL.slice(0, 5).map((image) => image.id),
    currentIndex: 0,
  };
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
    "padding:0",
    "overflow:visible",
    "color:#202634",
  ].join(";");

  const stage = document.createElement("div");
  stage.style.cssText = [
    "position:relative",
    `width:${IMAGE_STACK_OBJECT_SIZE}px`,
    `height:${IMAGE_STACK_OBJECT_SIZE}px`,
    "border-radius:44px",
    "background:#f4f7fb",
    "touch-action:pan-y",
    "overflow:hidden",
    "box-shadow:0 10px 22px rgba(20, 29, 46, 0.14)",
    "perspective:900px",
  ].join(";");

  const indexBadge = document.createElement("div");
  indexBadge.style.cssText =
    "position:absolute; bottom:18px; right:18px; z-index:20; background:rgba(19, 29, 45, 0.58); color:#fff; font-size:12px; font-weight:600; border-radius:999px; padding:4px 9px;";

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
    "position:absolute; top:18px; right:18px; z-index:22; width:34px; height:34px; border:none; border-radius:16px; background:rgba(16, 24, 38, 0.48); color:#ffffff; cursor:pointer; font-size:16px; line-height:1; display:grid; place-items:center; backdrop-filter:blur(2px);";

  const cleanupListeners: Array<() => void> = [];

  let startX = 0;
  let isPointerDown = false;
  let lastDirection: "forward" | "backward" | null = null;
  let previousImageForTransition: PlaceholderImage | null = null;
  let isExpanded = false;
  let pendingOpenTransition: { fromRect: DOMRect; imageUrl: string; index: number } | null = null;
  let pendingCloseTransition: { fromRect: DOMRect; imageUrl: string } | null = null;
  let isMorphingToSingle = false;
  let selectedGridThumbnail: HTMLButtonElement | null = null;

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
      "border-radius:44px",
      "background-size:cover",
      "background-position:center",
      `background-image:url('${image.url}')`,
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

  function animateSharedImageTransition(
    fromRect: DOMRect,
    toRect: DOMRect,
    imageUrl: string,
    fromRadius: number,
    toRadius: number,
    onDone?: () => void,
  ) {
    const ghost = document.createElement("div");
    ghost.style.cssText = [
      "position:fixed",
      `left:${fromRect.left}px`,
      `top:${fromRect.top}px`,
      `width:${fromRect.width}px`,
      `height:${fromRect.height}px`,
      "pointer-events:none",
      "z-index:99999",
      `border-radius:${fromRadius}px`,
      `background-image:url('${imageUrl}')`,
      "background-size:cover",
      "background-position:center",
      "box-shadow:0 10px 24px rgba(14, 22, 36, 0.22)",
      "overflow:hidden",
    ].join(";");

    document.body.appendChild(ghost);

    const animation = ghost.animate(
      [
        {
          left: `${fromRect.left}px`,
          top: `${fromRect.top}px`,
          width: `${fromRect.width}px`,
          height: `${fromRect.height}px`,
          borderRadius: `${fromRadius}px`,
          boxShadow: "0 10px 24px rgba(14, 22, 36, 0.22)",
        },
        {
          left: `${toRect.left}px`,
          top: `${toRect.top}px`,
          width: `${toRect.width}px`,
          height: `${toRect.height}px`,
          borderRadius: `${toRadius}px`,
          boxShadow: "0 6px 16px rgba(14, 22, 36, 0.16)",
        },
      ],
      {
        duration: 360,
        easing: "cubic-bezier(0.22, 0.73, 0.2, 1)",
        fill: "both",
      },
    );

    animation.onfinish = () => {
      onDone?.();
      requestAnimationFrame(() => {
        ghost.remove();
      });
    };
  }

  function buildGridThumbnail(image: PlaceholderImage, index: number, total: number): HTMLButtonElement {
    const thumb = document.createElement("button");
    thumb.type = "button";
    thumb.style.cssText = [
      "border:none",
      "padding:0",
      "margin:0",
      "border-radius:14px",
      "cursor:pointer",
      "overflow:hidden",
      "position:relative",
      "width:100%",
      "aspect-ratio:1 / 1",
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

  function animateGridFanOut(gridItems: HTMLButtonElement[], skipIndex?: number) {
    gridItems.forEach((item, index) => {
      if (typeof skipIndex === "number" && index === skipIndex) {
        return;
      }

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
    const side = Math.floor(Math.min(root.clientWidth, root.clientHeight));
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
    selectedGridThumbnail = null;
    const shouldHideStageChrome = isExpanded || isMorphingToSingle;
    stage.style.boxShadow = shouldHideStageChrome ? "none" : "0 10px 22px rgba(20, 29, 46, 0.14)";
    stage.style.background = shouldHideStageChrome ? "transparent" : "#f4f7fb";

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
        "position:absolute; inset:0; display:grid; grid-template-columns:repeat(3, minmax(0, 1fr)); gap:10px; align-content:start; padding:12px; background:transparent; backdrop-filter:none; z-index:14;";

      const gridItems = images.map((image, index) => {
        const thumb = buildGridThumbnail(image, index, images.length);
        if (index === state.currentIndex) {
          thumb.style.outline = "2px solid #007AFF";
          selectedGridThumbnail = thumb;
        }

        const onSelect = () => {
          const fromRect = thumb.getBoundingClientRect();
          state.currentIndex = index;
          isExpanded = false;
          isMorphingToSingle = true;
          pendingCloseTransition = {
            fromRect,
            imageUrl: image.url,
          };
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

      if (pendingOpenTransition) {
        const target = gridItems[pendingOpenTransition.index] ?? null;
        if (target) {
          target.style.opacity = "0";
          animateGridFanOut(gridItems, pendingOpenTransition.index);
          animateSharedImageTransition(
            pendingOpenTransition.fromRect,
            target.getBoundingClientRect(),
            pendingOpenTransition.imageUrl,
            44,
            14,
            () => {
              target.style.opacity = "1";
            },
          );
        } else {
          animateGridFanOut(gridItems);
        }

        pendingOpenTransition = null;
      } else {
        animateGridFanOut(gridItems);
      }

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

    if (pendingCloseTransition) {
      incomingCard.style.opacity = "0";
      animateSharedImageTransition(
        pendingCloseTransition.fromRect,
        incomingCard.getBoundingClientRect(),
        pendingCloseTransition.imageUrl,
        14,
        44,
        () => {
          incomingCard.style.transition = "none";
          incomingCard.style.opacity = "1";
          void incomingCard.offsetWidth;
          isMorphingToSingle = false;
          stage.style.boxShadow = "0 10px 22px rgba(20, 29, 46, 0.14)";
          stage.style.background = "#f4f7fb";
        },
      );
      pendingCloseTransition = null;
    }

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
    const images = getCurrentImages();
    const currentImage = images[state.currentIndex];

    if (isExpanded) {
      if (currentImage && selectedGridThumbnail) {
        pendingCloseTransition = {
          fromRect: selectedGridThumbnail.getBoundingClientRect(),
          imageUrl: currentImage.url,
        };
        isMorphingToSingle = true;
      }

      isExpanded = false;
      previousImageForTransition = null;
      lastDirection = null;
      render();
      return;
    }

    if (currentImage) {
      pendingOpenTransition = {
        fromRect: stage.getBoundingClientRect(),
        imageUrl: currentImage.url,
        index: state.currentIndex,
      };
    }

    isExpanded = true;
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

export function setupImageStackRenderer() {
  const mountedWidgets = new Map<string, MountedImageStack>();

  KritzelCustomElementRendererRegistry.register(IMAGE_STACK_RENDERER_KEY, {
    onMount: ({ object, container, data }) => {
      if (!container) {
        return;
      }

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
    translateX: 260,
    translateY: -190,
    width: IMAGE_STACK_OBJECT_SIZE,
    height: IMAGE_STACK_OBJECT_SIZE,
  });

  imageStackElement.isRotatable = false;

  return imageStackElement;
}
