import { KritzelCustomElement } from "kritzel-react";
import { KritzelCustomElementRendererRegistry } from "kritzel-stencil";

export const ROCKET_TODO_RENDERER_KEY = "website-hero-rocket-todo";

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

const DEFAULT_ROCKET_TODO_STATE: RocketTodoState = {
  items: [
    { id: "fuel", title: "Confirm propellant tanks are filled and pressure-stable", isChecked: true },
    { id: "telemetry", title: "Verify live telemetry stream from all critical sensors", isChecked: true },
    { id: "weather", title: "Approve weather and lightning window for launch corridor", isChecked: true },
    { id: "range", title: "Receive final range safety clearance and abort readiness", isChecked: true },
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

function cloneRocketTodoState(state: RocketTodoState): RocketTodoState {
  return {
    items: state.items.map((item) => ({ ...item })),
  };
}

export function createRocketTodoInitialState(): RocketTodoState {
  return cloneRocketTodoState(DEFAULT_ROCKET_TODO_STATE);
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

function mountRocketTodoWidget(initialState: RocketTodoState): MountedRocketTodo {
  const state = cloneRocketTodoState(initialState);

  const root = document.createElement("section");
  root.style.cssText = [
    "height:100%",
    "box-sizing:border-box",
    "border-radius:8px",
    "border:7px solid #e4e7eb",
    "background:#ffffff",
    "font-family:'Segoe UI', Tahoma, sans-serif",
    "display:flex",
    "flex-direction:column",
    "overflow:hidden",
    "color:#22252a",
  ].join(";");

  const header = document.createElement("div");
  header.style.cssText = "padding:9px 9px 7px; border-bottom:1px solid #efeff0;";

  const heading = document.createElement("h2");
  heading.textContent = "Today";
  heading.style.cssText = "margin:0; font-size:21px; line-height:1; font-weight:700; letter-spacing:-0.03em;";

  const subheading = document.createElement("p");
  subheading.textContent = "Rocket Launch Tasks 5";
  subheading.style.cssText = "margin:5px 0 0; color:#5f646d; font-size:8px; font-weight:600;";

  const list = document.createElement("ul");
  list.style.cssText = "margin:0; padding:0; list-style:none; overflow:auto; border-radius:8px;";

  const listeners: Array<() => void> = [];

  state.items.forEach((item) => {
    const row = document.createElement("li");
    row.style.cssText =
      "display:grid; grid-template-columns:auto 1fr auto; align-items:center; gap:6px; padding:8px 9px; border-bottom:1px solid #efeff0; background:#ffffff;";

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = item.isChecked;
    checkbox.style.cssText = [
      "inline-size:12px",
      "block-size:12px",
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
    label.style.cssText = "display:block; font-size:9px; line-height:1.3; color:#262a33;";

    const meta = document.createElement("span");
    meta.textContent = "Required before launch";
    meta.style.cssText = "display:block; margin-top:2px; color:#66a443; font-size:8px;";

    const category = document.createElement("span");
    category.textContent = CATEGORY_LABEL_BY_ID[item.id] ?? "Launch #";
    category.style.cssText = "font-size:8px; color:#80858f; white-space:nowrap;";

    const applyCheckedStyle = () => {
      checkbox.style.backgroundColor = checkbox.checked ? "#007AFF" : "#ffffff";
      checkbox.style.borderColor = checkbox.checked ? "#007AFF" : "#c5c8cf";
      checkbox.style.backgroundImage = checkbox.checked
        ? 'url("data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 viewBox=%270 0 20 20%27%3E%3Cpath d=%27M5 10.5l3.1 3.2L15.3 6.8%27 fill=%27none%27 stroke=%27white%27 stroke-width=%272.3%27 stroke-linecap=%27round%27 stroke-linejoin=%27round%27/%3E%3C/svg%3E")'
        : "none";
      checkbox.style.backgroundRepeat = "no-repeat";
      checkbox.style.backgroundPosition = "center";
      checkbox.style.backgroundSize = "9px 9px";
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

export function setupRocketTodoRenderer() {
  const mountedWidgets = new Map<string, MountedRocketTodo>();

  KritzelCustomElementRendererRegistry.register(ROCKET_TODO_RENDERER_KEY, {
    onMount: ({ object, container, data }) => {
      if (!container) {
        return;
      }

      const previousWidget = mountedWidgets.get(object.id);
      if (previousWidget) {
        previousWidget.destroy();
        previousWidget.root.remove();
        mountedWidgets.delete(object.id);
      }

      const mountedWidget = mountRocketTodoWidget(normalizeRocketTodoState(data));
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
    KritzelCustomElementRendererRegistry.unregister(ROCKET_TODO_RENDERER_KEY);
  };
}

export function createRocketTodoCustomElement() {
  const placeholder = document.createElement("div");
  placeholder.textContent = "Loading Launch Checklist...";

  const customElement = new KritzelCustomElement({
    element: placeholder,
    rendererKey: ROCKET_TODO_RENDERER_KEY,
    rendererData: createRocketTodoInitialState(),
    translateX: -1225,
    translateY: -482,
    width: 339,
    height: 433
  });

  customElement.isRotatable = false;

  return customElement;
}
