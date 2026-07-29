import { KritzelCustomElement } from "kritzel-react";
import { KritzelCustomElementRendererRegistry } from "kritzel-stencil";

export const ARTEMIS_BOOSTER_SEPARATION_VIDEO_RENDERER_KEY = "website-hero-artemis-booster-separation-video";
const ARTEMIS_BOOSTER_SEPARATION_VIDEO_Z_INDEX = 12;
const ARTEMIS_BOOSTER_SEPARATION_VIDEO_WIDTH = 420;
const ARTEMIS_BOOSTER_SEPARATION_VIDEO_HEIGHT = 236;

const normalizedBaseUrl = import.meta.env.BASE_URL.endsWith("/")
  ? import.meta.env.BASE_URL
  : `${import.meta.env.BASE_URL}/`;

function withBaseUrl(assetPath: string): string {
  return `${normalizedBaseUrl}${assetPath.replace(/^\/+/, "")}`;
}

type ArtemisBoosterSeparationVideoState = {
  schemaVersion: 1;
  currentTimeSec: number;
  volume: number;
  isMuted: boolean;
};

type MountedArtemisBoosterSeparationVideo = {
  root: HTMLElement;
  getState: () => ArtemisBoosterSeparationVideoState;
  destroy: () => void;
};

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function createArtemisBoosterSeparationVideoInitialState(): ArtemisBoosterSeparationVideoState {
  return {
    schemaVersion: 1,
    currentTimeSec: 0,
    volume: 1,
    isMuted: false,
  };
}

function normalizeArtemisBoosterSeparationVideoState(data: unknown): ArtemisBoosterSeparationVideoState {
  const fallback = createArtemisBoosterSeparationVideoInitialState();
  if (!data || typeof data !== "object") {
    return fallback;
  }

  const candidate = data as Partial<ArtemisBoosterSeparationVideoState>;
  if (candidate.schemaVersion !== 1) {
    return fallback;
  }

  return {
    schemaVersion: 1,
    currentTimeSec:
      typeof candidate.currentTimeSec === "number" && Number.isFinite(candidate.currentTimeSec)
        ? Math.max(0, candidate.currentTimeSec)
        : fallback.currentTimeSec,
    volume:
      typeof candidate.volume === "number" && Number.isFinite(candidate.volume)
        ? clamp(candidate.volume, 0, 1)
        : fallback.volume,
    isMuted: typeof candidate.isMuted === "boolean" ? candidate.isMuted : fallback.isMuted,
  };
}

function cloneArtemisBoosterSeparationVideoState(
  state: ArtemisBoosterSeparationVideoState,
): ArtemisBoosterSeparationVideoState {
  return {
    schemaVersion: state.schemaVersion,
    currentTimeSec: state.currentTimeSec,
    volume: state.volume,
    isMuted: state.isMuted,
  };
}

function mountArtemisBoosterSeparationVideoWidget(
  initialState: ArtemisBoosterSeparationVideoState,
): MountedArtemisBoosterSeparationVideo {
  const state = cloneArtemisBoosterSeparationVideoState(initialState);
  const listeners: Array<() => void> = [];
  let isHoveringStage = false;
  const videoUrl = withBaseUrl("artemis_booster_separation.mp4");

  const root = document.createElement("section");
  root.style.cssText = [
    "height:100%",
    "width:100%",
    "box-sizing:border-box",
    "border:4.4px solid #e4e7eb",
    "border-radius:5.5px",
    "background:#ffffff",
    "display:flex",
    "overflow:hidden",
    "touch-action:manipulation",
  ].join(";");

  const stage = document.createElement("div");
  stage.style.cssText = "position:relative; width:100%; height:100%; background:#000000;";

  const video = document.createElement("video");
  video.src = videoUrl;
  video.controls = false;
  video.preload = "metadata";
  video.playsInline = true;
  video.autoplay = false;
  video.muted = state.isMuted;
  video.volume = state.volume;
  video.style.cssText = "display:block; width:100%; height:100%; object-fit:cover; background:#000000;";

  const playbackButton = document.createElement("button");
  playbackButton.type = "button";
  playbackButton.style.cssText = [
    "position:absolute",
    "left:50%",
    "top:50%",
    "transform:translate(-50%, -50%)",
    "width:56px",
    "height:56px",
    "border:1px solid rgba(255,255,255,0.55)",
    "border-radius:999px",
    "background:rgba(12,18,28,0.65)",
    "color:#ffffff",
    "font-size:24px",
    "line-height:1",
    "padding:0",
    "cursor:pointer",
    "display:grid",
    "place-items:center",
    "backdrop-filter:blur(4px)",
    "z-index:2",
  ].join(";");

  const updatePlaybackButton = () => {
    if (video.paused) {
      playbackButton.textContent = "▶";
      playbackButton.setAttribute("aria-label", "Play video");
      playbackButton.style.display = "grid";
      return;
    }

    playbackButton.textContent = "❚❚";
    playbackButton.setAttribute("aria-label", "Pause video");
    playbackButton.style.display = isHoveringStage ? "grid" : "none";
  };

  const stopPointerPropagation = (event: Event) => {
    event.stopPropagation();
  };

  const onLoadedMetadata = () => {
    if (state.currentTimeSec > 0 && Number.isFinite(video.duration)) {
      video.currentTime = Math.min(state.currentTimeSec, Math.max(0, video.duration));
    }
  };

  const onTimeUpdate = () => {
    if (Number.isFinite(video.currentTime)) {
      state.currentTimeSec = Math.max(0, video.currentTime);
    }
  };

  const onVolumeChange = () => {
    state.volume = clamp(video.volume, 0, 1);
    state.isMuted = video.muted;
  };

  const onPlay = () => {
    updatePlaybackButton();
  };

  const onPause = () => {
    updatePlaybackButton();
  };

  const onPlaybackButtonClick = () => {
    if (video.paused) {
      void video.play();
      return;
    }

    video.pause();
  };

  const onStageMouseEnter = () => {
    isHoveringStage = true;
    updatePlaybackButton();
  };

  const onStageMouseLeave = () => {
    isHoveringStage = false;
    updatePlaybackButton();
  };

  [playbackButton].forEach((element) => {
    element.addEventListener("pointerdown", stopPointerPropagation);
    element.addEventListener("pointerup", stopPointerPropagation);
    element.addEventListener("pointermove", stopPointerPropagation);
  });

  video.addEventListener("loadedmetadata", onLoadedMetadata);
  video.addEventListener("timeupdate", onTimeUpdate);
  video.addEventListener("volumechange", onVolumeChange);
  video.addEventListener("play", onPlay);
  video.addEventListener("pause", onPause);
  playbackButton.addEventListener("click", onPlaybackButtonClick);
  stage.addEventListener("mouseenter", onStageMouseEnter);
  stage.addEventListener("mouseleave", onStageMouseLeave);

  listeners.push(() => video.removeEventListener("loadedmetadata", onLoadedMetadata));
  listeners.push(() => video.removeEventListener("timeupdate", onTimeUpdate));
  listeners.push(() => video.removeEventListener("volumechange", onVolumeChange));
  listeners.push(() => video.removeEventListener("play", onPlay));
  listeners.push(() => video.removeEventListener("pause", onPause));
  listeners.push(() => playbackButton.removeEventListener("click", onPlaybackButtonClick));
  listeners.push(() => stage.removeEventListener("mouseenter", onStageMouseEnter));
  listeners.push(() => stage.removeEventListener("mouseleave", onStageMouseLeave));

  [playbackButton].forEach((element) => {
    listeners.push(() => element.removeEventListener("pointerdown", stopPointerPropagation));
    listeners.push(() => element.removeEventListener("pointerup", stopPointerPropagation));
    listeners.push(() => element.removeEventListener("pointermove", stopPointerPropagation));
  });

  root.tabIndex = 0;
  root.setAttribute("aria-label", "Artemis booster separation video");
  stage.appendChild(video);
  stage.appendChild(playbackButton);
  root.appendChild(stage);
  updatePlaybackButton();

  return {
    root,
    getState: () => cloneArtemisBoosterSeparationVideoState(state),
    destroy: () => {
      listeners.forEach((cleanup) => cleanup());
      video.pause();
    },
  };
}

export function setupArtemisBoosterSeparationVideoRenderer() {
  const mountedWidgets = new Map<string, MountedArtemisBoosterSeparationVideo>();

  KritzelCustomElementRendererRegistry.register(ARTEMIS_BOOSTER_SEPARATION_VIDEO_RENDERER_KEY, {
    onMount: ({ object, container, data }) => {
      if (!container) {
        return;
      }

      object.isResizable = true;
      object.isRotatable = false;
      object.zIndex = ARTEMIS_BOOSTER_SEPARATION_VIDEO_Z_INDEX;

      const previousWidget = mountedWidgets.get(object.id);
      if (previousWidget) {
        previousWidget.destroy();
        previousWidget.root.remove();
        mountedWidgets.delete(object.id);
      }

      const mountedWidget = mountArtemisBoosterSeparationVideoWidget(
        normalizeArtemisBoosterSeparationVideoState(data),
      );
      container.innerHTML = "";
      container.appendChild(mountedWidget.root);
      requestAnimationFrame(() => {
        const objectElement = container.closest<HTMLElement>(".object");
        if (objectElement) {
          objectElement.style.zIndex = `${ARTEMIS_BOOSTER_SEPARATION_VIDEO_Z_INDEX}`;
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
    KritzelCustomElementRendererRegistry.unregister(ARTEMIS_BOOSTER_SEPARATION_VIDEO_RENDERER_KEY);
  };
}

export function createArtemisBoosterSeparationVideoCustomElement() {
  const placeholder = document.createElement("div");
  placeholder.textContent = "Loading Artemis Booster Separation Video...";

  const customElement = new KritzelCustomElement({
    element: placeholder,
    rendererKey: ARTEMIS_BOOSTER_SEPARATION_VIDEO_RENDERER_KEY,
    rendererData: createArtemisBoosterSeparationVideoInitialState(),
    translateX: 645,
    translateY: 141,
    width: ARTEMIS_BOOSTER_SEPARATION_VIDEO_WIDTH,
    height: ARTEMIS_BOOSTER_SEPARATION_VIDEO_HEIGHT,
  });

  customElement.isRotatable = false;
  customElement.isResizable = true;
  customElement.zIndex = ARTEMIS_BOOSTER_SEPARATION_VIDEO_Z_INDEX;

  return customElement;
}
