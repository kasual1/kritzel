import { KritzelCustomElement } from "kritzel-react";
import { KritzelCustomElementRendererRegistry } from "kritzel-stencil";

export const CORE_STAGE_DASHBOARD_RENDERER_KEY = "website-hero-core-stage-dashboard";
const CORE_STAGE_DASHBOARD_Z_INDEX = 14;
const CORE_STAGE_DASHBOARD_WIDTH = 332;
const CORE_STAGE_DASHBOARD_HEIGHT = 224;

type CoreStageDashboardState = {
  missionTimeSec: number;
  throttlePercent: number;
  rs25BoostMode: boolean;
  aerodynamicProfile: "nominal" | "delayed" | "flattened";
};

type MountedCoreStageDashboard = {
  root: HTMLElement;
  getState: () => CoreStageDashboardState;
  destroy: () => void;
};

export function createCoreStageDashboardInitialState(): CoreStageDashboardState {
  return {
    missionTimeSec: 72,
    throttlePercent: 96,
    rs25BoostMode: false,
    aerodynamicProfile: "nominal",
  };
}

function cloneCoreStageDashboardState(state: CoreStageDashboardState): CoreStageDashboardState {
  return {
    missionTimeSec: state.missionTimeSec,
    throttlePercent: state.throttlePercent,
    rs25BoostMode: state.rs25BoostMode,
    aerodynamicProfile: state.aerodynamicProfile,
  };
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function normalizeCoreStageDashboardState(data: unknown): CoreStageDashboardState {
  const fallback = createCoreStageDashboardInitialState();
  if (!data || typeof data !== "object") {
    return fallback;
  }

  const candidate = data as Partial<CoreStageDashboardState>;
  return {
    missionTimeSec:
      typeof candidate.missionTimeSec === "number"
        ? clamp(Math.round(candidate.missionTimeSec), 0, 480)
        : fallback.missionTimeSec,
    throttlePercent:
      typeof candidate.throttlePercent === "number"
        ? clamp(Math.round(candidate.throttlePercent), 67, 109)
        : fallback.throttlePercent,
    rs25BoostMode:
      typeof candidate.rs25BoostMode === "boolean"
        ? candidate.rs25BoostMode
        : fallback.rs25BoostMode,
    aerodynamicProfile:
      candidate.aerodynamicProfile === "delayed" ||
      candidate.aerodynamicProfile === "flattened" ||
      candidate.aerodynamicProfile === "nominal"
        ? candidate.aerodynamicProfile
        : fallback.aerodynamicProfile,
  };
}

function getMaxQScale(state: CoreStageDashboardState): number {
  const throttleFactor = (state.throttlePercent - 67) / 42;
  const profileScale =
    state.aerodynamicProfile === "flattened" ? 0.83 : state.aerodynamicProfile === "delayed" ? 0.96 : 1;

  return (0.9 + throttleFactor * 0.23 + (state.rs25BoostMode ? 0.1 : 0)) * profileScale;
}

function getAerodynamicProfileParameters(profile: CoreStageDashboardState["aerodynamicProfile"]) {
  if (profile === "delayed") {
    return {
      peakTime: 148,
      peakWidth: 54,
      peakAmplitude: 1,
      tailSlope: 0.2,
      zoneDuration: 72,
    };
  }

  if (profile === "flattened") {
    return {
      peakTime: 108,
      peakWidth: 68,
      peakAmplitude: 0.68,
      tailSlope: 0.12,
      zoneDuration: 96,
    };
  }

  return {
    peakTime: 108,
    peakWidth: 42,
    peakAmplitude: 1,
    tailSlope: 0.2,
    zoneDuration: 62,
  };
}

function getBaseDynamicPressure(time: number, profile: CoreStageDashboardState["aerodynamicProfile"]): number {
  const { peakTime, peakWidth, peakAmplitude, tailSlope } = getAerodynamicProfileParameters(profile);

  return (
    110 +
    660 * peakAmplitude * Math.exp(-Math.pow((time - peakTime) / peakWidth, 2)) +
    (time > 150 ? (time - 150) * tailSlope : 0)
  );
}

function getDynamicPressureValue(state: CoreStageDashboardState, time: number): number {
  return clamp(getBaseDynamicPressure(time, state.aerodynamicProfile) * getMaxQScale(state), 80, 900);
}

function computeMetrics(state: CoreStageDashboardState) {
  const time = state.missionTimeSec;
  const throttleFactor = (state.throttlePercent - 67) / 42;
  const boostMultiplier = state.rs25BoostMode ? 1.18 : 1;
  const loxFill = clamp(100 - time * (0.18 + throttleFactor * 0.07) * boostMultiplier, 4, 100);
  const lh2Fill = clamp(100 - time * (0.145 + throttleFactor * 0.06) * boostMultiplier, 7, 100);
  const thermalDelta = clamp(time * 0.22 + (state.rs25BoostMode ? 12 : 0) + throttleFactor * 8, 0, 132);
  const loxTempF = -297 + thermalDelta;
  const lh2TempF = -423 + thermalDelta * 1.08;

  const gForce = 0.95 + throttleFactor * 2.4 + (time / 480) * 1.6 + (state.rs25BoostMode ? 0.42 : 0);

  const maxQScale = getMaxQScale(state);
  const maxQpsf = getDynamicPressureValue(state, time);

  return {
    loxFill,
    lh2Fill,
    loxTempF,
    lh2TempF,
    gForce,
    maxQpsf,
    maxQScale,
  };
}

function createTelemetrySeries(samples = 120) {
  const points: Array<{ x: number; time: number }> = [];
  const maxTime = 480;
  for (let index = 0; index <= samples; index += 1) {
    const time = (index / samples) * maxTime;
    points.push({ x: index / samples, time });
  }

  return points;
}

function buildSmoothSvgPath(points: Array<{ x: number; y: number }>): string {
  if (points.length === 0) {
    return "";
  }

  if (points.length === 1) {
    return `M${points[0].x.toFixed(2)} ${points[0].y.toFixed(2)}`;
  }

  let path = `M${points[0].x.toFixed(2)} ${points[0].y.toFixed(2)}`;

  for (let index = 1; index < points.length - 1; index += 1) {
    const current = points[index];
    const next = points[index + 1];
    const midX = (current.x + next.x) / 2;
    const midY = (current.y + next.y) / 2;
    path += ` Q ${current.x.toFixed(2)} ${current.y.toFixed(2)} ${midX.toFixed(2)} ${midY.toFixed(2)}`;
  }

  const penultimate = points[points.length - 2];
  const last = points[points.length - 1];
  path += ` Q ${penultimate.x.toFixed(2)} ${penultimate.y.toFixed(2)} ${last.x.toFixed(2)} ${last.y.toFixed(2)}`;

  return path;
}

function createProgressBar(color: string) {
  const outer = document.createElement("div");
  outer.style.cssText =
    "position:relative; width:100%; height:8px; border-radius:999px; background:#e5e7eb; overflow:hidden;";

  const fill = document.createElement("div");
  fill.style.cssText = [
    "height:100%",
    "width:0%",
    "border-radius:999px",
    `background:${color}`,
    "transition:width 220ms ease",
  ].join(";");

  outer.appendChild(fill);
  return { outer, fill };
}

function mountCoreStageDashboardWidget(initialState: CoreStageDashboardState): MountedCoreStageDashboard {
  const state = cloneCoreStageDashboardState(initialState);
  const listeners: Array<() => void> = [];
  const maxQSeries = createTelemetrySeries();

  const root = document.createElement("section");
  root.style.cssText = [
    "height:100%",
    "width:100%",
    "box-sizing:border-box",
    "font-family:'Segoe UI', Tahoma, sans-serif",
    "border:4.4px solid #e4e7eb",
    "border-radius:5.5px",
    "background:#ffffff",
    "box-shadow:none",
    "display:flex",
    "flex-direction:column",
    "overflow:hidden",
    "color:#22252a",
    "touch-action:manipulation",
    "user-select:none",
  ].join(";");

  const body = document.createElement("div");
  body.style.cssText = "display:grid; grid-template-columns:1fr 1fr; gap:8px; padding:6px 6px 8px; min-height:0; align-items:start;";

  const panelStyle =
    "border:1px solid #d9dde4; border-radius:11px; background:#ffffff; box-shadow:none;";

  const leftCol = document.createElement("div");
  leftCol.style.cssText = "display:flex; flex-direction:column; gap:8px;";
  const rightCol = document.createElement("div");
  rightCol.style.cssText = "display:flex; flex-direction:column; gap:8px; min-height:0; height:100%;";

  const loxCard = document.createElement("div");
  loxCard.style.cssText =
    `${panelStyle}; padding:6px; display:flex; flex-direction:column; gap:4px;`;

  const loxTitle = document.createElement("div");
  loxTitle.textContent = "LOX tank";
  loxTitle.style.cssText = "font-size:10px; font-weight:700; letter-spacing:0.02em; text-transform:uppercase; color:#1d4ed8;";

  const loxFillLabel = document.createElement("div");
  loxFillLabel.style.cssText = "font-size:10px; color:#1e3a8a;";
  const loxFillBar = createProgressBar("linear-gradient(90deg, #4f8cff 0%, #007AFF 100%)");
  const loxTempLabel = document.createElement("div");
  loxTempLabel.style.cssText = "font-size:10px; color:#1e3a8a;";

  const lh2Card = document.createElement("div");
  lh2Card.style.cssText =
    `${panelStyle}; padding:6px; display:flex; flex-direction:column; gap:4px;`;

  const lh2Title = document.createElement("div");
  lh2Title.textContent = "LH2 tank";
  lh2Title.style.cssText = "font-size:10px; font-weight:700; letter-spacing:0.02em; text-transform:uppercase; color:#047857;";

  const lh2FillLabel = document.createElement("div");
  lh2FillLabel.style.cssText = "font-size:10px; color:#065f46;";
  const lh2FillBar = createProgressBar("linear-gradient(90deg, #34d399 0%, #059669 100%)");
  const lh2TempLabel = document.createElement("div");
  lh2TempLabel.style.cssText = "font-size:10px; color:#065f46;";

  const gForceLabel = document.createElement("div");
  gForceLabel.style.cssText = "font-size:10px; color:#2f3a52;";

  const rs25ModeButton = document.createElement("button");
  rs25ModeButton.type = "button";
  rs25ModeButton.style.cssText =
    "border:1px solid #c8dcff; border-radius:9px; background:#edf4ff; color:#007AFF; font-size:10px; font-weight:700; padding:6px; cursor:pointer;";

  const aerodynamicProfileButton = document.createElement("button");
  aerodynamicProfileButton.type = "button";
  aerodynamicProfileButton.style.cssText =
    "border:1px solid #d1d5db; border-radius:9px; background:#f9fafb; color:#374151; font-size:10px; font-weight:700; padding:6px; cursor:pointer; margin-top:0;";

  const profileColumn = document.createElement("div");
  profileColumn.style.cssText = "display:flex; flex-direction:column; gap:6px; width:80px; flex:0 0 auto;";

  const chartCard = document.createElement("div");
  chartCard.style.cssText =
    `${panelStyle}; grid-column:1 / span 2; padding:6px; display:flex; flex-direction:column; gap:5px;`;

  const chartTitle = document.createElement("div");
  chartTitle.textContent = "Dynamic pressure (Max-Q)";
  chartTitle.style.cssText = "font-size:10px; font-weight:700; text-transform:uppercase; letter-spacing:0.02em; color:#1f2a44;";

  const chartWrap = document.createElement("div");
  chartWrap.style.cssText = "height:64px; width:100%;";

  const chartSvg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  chartSvg.setAttribute("viewBox", "0 0 200 74");
  chartSvg.setAttribute("width", "100%");
  chartSvg.setAttribute("height", "100%");

  const maxQZone = document.createElementNS("http://www.w3.org/2000/svg", "rect");
  maxQZone.setAttribute("x", "33");
  maxQZone.setAttribute("y", "8");
  maxQZone.setAttribute("width", "26");
  maxQZone.setAttribute("height", "58");
  maxQZone.setAttribute("fill", "#007AFF1f");

  const chartPath = document.createElementNS("http://www.w3.org/2000/svg", "path");
  chartPath.setAttribute("fill", "none");
  chartPath.setAttribute("stroke", "#007AFF");
  chartPath.setAttribute("stroke-width", "2");

  const currentDot = document.createElementNS("http://www.w3.org/2000/svg", "circle");
  currentDot.setAttribute("r", "3.4");
  currentDot.setAttribute("fill", "#007AFF");

  const chartBottomAxis = document.createElementNS("http://www.w3.org/2000/svg", "line");
  chartBottomAxis.setAttribute("x1", "0");
  chartBottomAxis.setAttribute("y1", "66");
  chartBottomAxis.setAttribute("x2", "200");
  chartBottomAxis.setAttribute("y2", "66");
  chartBottomAxis.setAttribute("stroke", "#d0d7e2");
  chartBottomAxis.setAttribute("stroke-width", "1");

  const chartLabel = document.createElement("div");
  chartLabel.style.cssText = "font-size:10px; color:#2f3a52;";

  const timelineCard = document.createElement("div");
  timelineCard.style.cssText =
    `${panelStyle}; grid-column:1 / span 2; padding:6px; display:flex; flex-direction:column; gap:6px;`;

  const timelineTopRow = document.createElement("div");
  timelineTopRow.style.cssText = "display:flex; justify-content:space-between; align-items:center; gap:8px;";

  const timelineLabel = document.createElement("span");
  timelineLabel.textContent = "Ascent timeline";
  timelineLabel.style.cssText = "font-size:10px; font-weight:700; text-transform:uppercase; letter-spacing:0.02em; color:#1f2a44;";

  const timelineMarker = document.createElement("span");
  timelineMarker.style.cssText = "font-size:10px; color:#2f3a52; font-weight:700;";

  const missionTimeSlider = document.createElement("input");
  missionTimeSlider.type = "range";
  missionTimeSlider.min = "0";
  missionTimeSlider.max = "480";
  missionTimeSlider.step = "1";
  missionTimeSlider.style.cssText = "width:100%; accent-color:#007AFF;";

  loxCard.appendChild(loxTitle);
  loxCard.appendChild(loxFillLabel);
  loxCard.appendChild(loxFillBar.outer);
  loxCard.appendChild(loxTempLabel);

  lh2Card.appendChild(lh2Title);
  lh2Card.appendChild(lh2FillLabel);
  lh2Card.appendChild(lh2FillBar.outer);
  lh2Card.appendChild(lh2TempLabel);

  chartSvg.appendChild(maxQZone);
  chartSvg.appendChild(chartBottomAxis);
  chartSvg.appendChild(chartPath);
  chartSvg.appendChild(currentDot);

  chartWrap.appendChild(chartSvg);
  const chartMain = document.createElement("div");
  chartMain.style.cssText = "flex:1; min-width:0; display:flex; flex-direction:column; gap:5px;";
  chartMain.appendChild(chartTitle);
  chartMain.appendChild(chartWrap);
  chartMain.appendChild(chartLabel);

  profileColumn.appendChild(rs25ModeButton);
  profileColumn.appendChild(aerodynamicProfileButton);
  profileColumn.appendChild(gForceLabel);

  const chartContent = document.createElement("div");
  chartContent.style.cssText = "display:flex; gap:8px; align-items:stretch; min-width:0;";
  chartContent.appendChild(chartMain);
  chartContent.appendChild(profileColumn);

  chartCard.appendChild(chartContent);

  leftCol.appendChild(loxCard);
  rightCol.appendChild(lh2Card);

  timelineTopRow.appendChild(timelineLabel);
  timelineTopRow.appendChild(timelineMarker);
  timelineCard.appendChild(timelineTopRow);
  timelineCard.appendChild(missionTimeSlider);

  body.appendChild(chartCard);
  body.appendChild(leftCol);
  body.appendChild(rightCol);
  body.appendChild(timelineCard);

  root.appendChild(body);

  function updateChart() {
    const maxValue = 900;
    const minValue = 80;
    const chartHeight = 58;
    const chartTopPadding = 8;
    const maxTime = 480;

    const profileParameters = getAerodynamicProfileParameters(state.aerodynamicProfile);
    const zoneStartTime = clamp(profileParameters.peakTime - profileParameters.zoneDuration / 2, 0, maxTime);
    const zoneEndTime = clamp(profileParameters.peakTime + profileParameters.zoneDuration / 2, 0, maxTime);
    const zoneX = (zoneStartTime / maxTime) * 200;
    const zoneWidth = ((zoneEndTime - zoneStartTime) / maxTime) * 200;
    maxQZone.setAttribute("x", `${zoneX.toFixed(2)}`);
    maxQZone.setAttribute("width", `${zoneWidth.toFixed(2)}`);

    const chartPoints = maxQSeries.map((entry) => {
        const x = entry.x * 200;
        const currentValue = getDynamicPressureValue(state, entry.time);
        const normalized = clamp((currentValue - minValue) / (maxValue - minValue), 0, 1);
        const y = chartTopPadding + (1 - normalized) * chartHeight;
        return { x, y };
      });

    const path = buildSmoothSvgPath(chartPoints);

    chartPath.setAttribute("d", path);

    const currentX = (state.missionTimeSec / 480) * 200;
    const currentValue = getDynamicPressureValue(state, state.missionTimeSec);
    const currentNormalized = clamp((currentValue - minValue) / (maxValue - minValue), 0, 1);
    const currentY = chartTopPadding + (1 - currentNormalized) * chartHeight;

    currentDot.setAttribute("cx", `${currentX}`);
    currentDot.setAttribute("cy", `${currentY}`);
  }

  function render() {
    const metrics = computeMetrics(state);

    timelineMarker.textContent = `${state.missionTimeSec}s`;

    loxFillLabel.textContent = `Fill ${metrics.loxFill.toFixed(0)}%`;
    loxFillBar.fill.style.width = `${metrics.loxFill}%`;
    loxTempLabel.textContent = `Temp ${metrics.loxTempF.toFixed(0)} deg F`;

    lh2FillLabel.textContent = `Fill ${metrics.lh2Fill.toFixed(0)}%`;
    lh2FillBar.fill.style.width = `${metrics.lh2Fill}%`;
    lh2TempLabel.textContent = `Temp ${metrics.lh2TempF.toFixed(0)} deg F`;

    gForceLabel.textContent = `${metrics.gForce.toFixed(2)} g longitudinal acceleration`;

    rs25ModeButton.textContent = state.rs25BoostMode
      ? "RS-25 profile: BOOST"
      : "RS-25 profile: NOMINAL";
    rs25ModeButton.style.background = state.rs25BoostMode ? "#007AFF" : "#edf4ff";
    rs25ModeButton.style.borderColor = state.rs25BoostMode ? "#007AFF" : "#c8dcff";
    rs25ModeButton.style.color = state.rs25BoostMode ? "#ffffff" : "#007AFF";

    aerodynamicProfileButton.textContent =
      state.aerodynamicProfile === "delayed"
        ? "Aero profile: DELAYED PEAK"
        : state.aerodynamicProfile === "flattened"
          ? "Aero profile: FLATTENED"
          : "Aero profile: NOMINAL";
    aerodynamicProfileButton.style.background =
      state.aerodynamicProfile === "nominal" ? "#f9fafb" : "#eef2ff";
    aerodynamicProfileButton.style.borderColor =
      state.aerodynamicProfile === "nominal" ? "#d1d5db" : "#c7d2fe";
    aerodynamicProfileButton.style.color =
      state.aerodynamicProfile === "nominal" ? "#374151" : "#3730a3";

    chartLabel.textContent =
      state.aerodynamicProfile === "nominal"
        ? `Max-Q ${metrics.maxQpsf.toFixed(0)} psf`
        : state.aerodynamicProfile === "delayed"
          ? `Max-Q ${metrics.maxQpsf.toFixed(0)} psf (delayed)`
          : `Max-Q ${metrics.maxQpsf.toFixed(0)} psf (flattened)`;

    missionTimeSlider.value = `${state.missionTimeSec}`;

    updateChart();
  }

  const stopPointerPropagation = (event: PointerEvent) => {
    event.stopPropagation();
  };

  const onMissionTimeInput = (event: Event) => {
    const target = event.target as HTMLInputElement;
    state.missionTimeSec = clamp(Math.round(Number(target.value)), 0, 480);
    render();
  };

  const onToggleRs25Mode = () => {
    state.rs25BoostMode = !state.rs25BoostMode;
    if (state.rs25BoostMode) {
      state.throttlePercent = Math.max(state.throttlePercent, 102);
    }
    render();
  };

  const onToggleAerodynamicProfile = () => {
    if (state.aerodynamicProfile === "nominal") {
      state.aerodynamicProfile = "delayed";
    } else if (state.aerodynamicProfile === "delayed") {
      state.aerodynamicProfile = "flattened";
    } else {
      state.aerodynamicProfile = "nominal";
    }

    render();
  };

  [missionTimeSlider, rs25ModeButton, aerodynamicProfileButton].forEach((element) => {
    element.addEventListener("pointerdown", stopPointerPropagation);
    element.addEventListener("pointerup", stopPointerPropagation);
  });

  missionTimeSlider.addEventListener("input", onMissionTimeInput);
  rs25ModeButton.addEventListener("click", onToggleRs25Mode);
  aerodynamicProfileButton.addEventListener("click", onToggleAerodynamicProfile);

  listeners.push(() => missionTimeSlider.removeEventListener("input", onMissionTimeInput));
  listeners.push(() => rs25ModeButton.removeEventListener("click", onToggleRs25Mode));
  listeners.push(() => aerodynamicProfileButton.removeEventListener("click", onToggleAerodynamicProfile));

  [missionTimeSlider, rs25ModeButton, aerodynamicProfileButton].forEach((element) => {
    listeners.push(() => element.removeEventListener("pointerdown", stopPointerPropagation));
    listeners.push(() => element.removeEventListener("pointerup", stopPointerPropagation));
  });

  root.tabIndex = 0;
  root.setAttribute("aria-label", "Artemis core stage dashboard");

  render();

  return {
    root,
    getState: () => cloneCoreStageDashboardState(state),
    destroy: () => {
      listeners.forEach((cleanup) => cleanup());
    },
  };
}

export function setupCoreStageDashboardRenderer() {
  const mountedWidgets = new Map<string, MountedCoreStageDashboard>();

  KritzelCustomElementRendererRegistry.register(CORE_STAGE_DASHBOARD_RENDERER_KEY, {
    onMount: ({ object, container, data }) => {
      if (!container) {
        return;
      }

      object.isResizable = true;
      object.isRotatable = false;
      object.zIndex = CORE_STAGE_DASHBOARD_Z_INDEX;

      const previousWidget = mountedWidgets.get(object.id);
      if (previousWidget) {
        previousWidget.destroy();
        previousWidget.root.remove();
        mountedWidgets.delete(object.id);
      }

      const mountedWidget = mountCoreStageDashboardWidget(normalizeCoreStageDashboardState(data));
      container.innerHTML = "";
      container.appendChild(mountedWidget.root);
      requestAnimationFrame(() => {
        const objectElement = container.closest<HTMLElement>(".object");
        if (objectElement) {
          objectElement.style.zIndex = `${CORE_STAGE_DASHBOARD_Z_INDEX}`;
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
    KritzelCustomElementRendererRegistry.unregister(CORE_STAGE_DASHBOARD_RENDERER_KEY);
  };
}

export function createCoreStageDashboardCustomElement() {
  const placeholder = document.createElement("div");
  placeholder.textContent = "Loading Core Stage Dashboard...";

  const customElement = new KritzelCustomElement({
    element: placeholder,
    rendererKey: CORE_STAGE_DASHBOARD_RENDERER_KEY,
    rendererData: createCoreStageDashboardInitialState(),
    translateX: -19,
    translateY: 141,
    width: CORE_STAGE_DASHBOARD_WIDTH,
    height: CORE_STAGE_DASHBOARD_HEIGHT,
  });

  customElement.isRotatable = false;
  customElement.isResizable = true;
  customElement.zIndex = CORE_STAGE_DASHBOARD_Z_INDEX;

  return customElement;
}
