import { defineCustomElement, type DefineComponent } from 'vue';
import {
  KritzelDynamicObjectRendererRegistry,
  type KritzelDynamicObjectRenderContext,
  type KritzelDynamicObjectRenderer,
} from '@kritzel/engine';

export interface VueDynamicObjectRendererOptions<TState = unknown> {
  tagName: string;
  component: DefineComponent<any, any, any, any, any, any, any, any>;
  createInitialState?: () => TState;
  getInitialState?: (data: unknown, context: KritzelDynamicObjectRenderContext) => TState;
  mapProps?: (state: TState | undefined, context: KritzelDynamicObjectRenderContext) => Record<string, unknown>;
  normalizeState?: (state: unknown, context: KritzelDynamicObjectRenderContext) => TState;
  onStateChangeProp?: string | null;
  styles?: string;
}

type MountedVueCustomElement<TState> = {
  host: HTMLElement;
  latestState: TState | undefined;
};

function setHostProps(host: HTMLElement, props: Record<string, unknown>): void {
  Object.entries(props).forEach(([key, value]) => {
    (host as unknown as Record<string, unknown>)[key] = value;
  });
}

export function createVueDynamicObjectRenderer<TState = unknown>(
  options: VueDynamicObjectRendererOptions<TState>,
): KritzelDynamicObjectRenderer {
  const mountedElements = new Map<string, MountedVueCustomElement<TState>>();

  const ensureCustomElementDefined = () => {
    if (!customElements.get(options.tagName)) {
      customElements.define(options.tagName, defineCustomElement(options.component));
    }
  };

  return {
    onMount: (context) => {
      if (!context.container) {
        return;
      }

      ensureCustomElementDefined();

      const initialState = options.getInitialState
        ? options.getInitialState(context.data, context)
        : (context.data as TState | undefined) ?? options.createInitialState?.();

      const host = document.createElement(options.tagName);
      const mounted: MountedVueCustomElement<TState> = {
        host,
        latestState: initialState,
      };

      const baseProps = options.mapProps
        ? options.mapProps(initialState, context)
        : (initialState !== undefined ? { initialState } : {});

      const onStateChangeProp = options.onStateChangeProp === undefined ? 'onStateChange' : options.onStateChangeProp;

      if (onStateChangeProp !== null) {
        const existing = baseProps[onStateChangeProp];
        baseProps[onStateChangeProp] = (nextState: unknown) => {
          mounted.latestState = options.normalizeState
            ? options.normalizeState(nextState, context)
            : (nextState as TState);

          if (typeof existing === 'function') {
            (existing as (value: unknown) => void)(nextState);
          }
        };
      }

      context.container.innerHTML = '';

      if (options.styles) {
        const styleElement = document.createElement('style');
        styleElement.textContent = options.styles;
        context.container.appendChild(styleElement);
      }

      setHostProps(host, baseProps);
      context.container.appendChild(host);

      mountedElements.set(context.object.id, mounted);
    },

    onUnmount: (context) => {
      const mounted = mountedElements.get(context.object.id);
      if (!mounted) {
        return undefined;
      }

      mounted.host.remove();
      mountedElements.delete(context.object.id);

      if (context.container) {
        context.container.innerHTML = '';
      }

      return mounted.latestState;
    },
  };
}

export function registerVueDynamicObjectRenderer<TState = unknown>(
  rendererKey: string,
  options: VueDynamicObjectRendererOptions<TState>,
): () => void {
  const renderer = createVueDynamicObjectRenderer(options);
  KritzelDynamicObjectRendererRegistry.register(rendererKey, renderer);

  return () => {
    KritzelDynamicObjectRendererRegistry.unregister(rendererKey);
  };
}
