import { useEffect, useRef } from "react";
import { createRoot, type Root } from "react-dom/client";
import {
  KritzelCustomElement,
  KritzelEditor,
  type HTMLKritzelEditorElement,
} from "kritzel-react";
import { KritzelCustomElementRendererRegistry } from "kritzel-stencil";
import { customReactTheme } from "../../../const/custom-react-theme";
import { editorStyle, hostStyle } from "../shared/concept-shared";
import {
  cloneTodoListState,
  createTodoListInitialState,
  TodoListComponent,
  type TodoListState,
} from "./TodoListComponent";

const TODO_RENDERER_KEY = "react-todo-list";

type MountedTodoRenderer = {
  root: Root;
  latestState: TodoListState;
};

export function CustomElementsPage() {
  const editorRef = useRef<HTMLKritzelEditorElement | null>(null);
  const hasAddedInitialCustomElement = useRef(false);
  const mountedRenderers = useRef<Map<string, MountedTodoRenderer>>(new Map());

  useEffect(() => {
    KritzelCustomElementRendererRegistry.register(TODO_RENDERER_KEY, {
      onMount: ({ object, container, data }) => {
        if (!container) {
          return;
        }

        const initialState = cloneTodoListState(
          (data as TodoListState | undefined) ?? createTodoListInitialState(),
        );

        const root = createRoot(container);
        const renderer: MountedTodoRenderer = {
          root,
          latestState: initialState,
        };

        mountedRenderers.current.set(object.id, renderer);

        root.render(
          <TodoListComponent
            initialState={initialState}
            onStateChange={(nextState) => {
              const current = mountedRenderers.current.get(object.id);
              if (current) {
                current.latestState = cloneTodoListState(nextState);
              }
            }}
          />,
        );
      },
      onUnmount: ({ object, container }) => {
        const renderer = mountedRenderers.current.get(object.id);
        if (!renderer) {
          return undefined;
        }

        const snapshot = cloneTodoListState(renderer.latestState);
        renderer.root.unmount();
        mountedRenderers.current.delete(object.id);

        if (container) {
          container.innerHTML = "";
        }

        return snapshot;
      },
    });

    return () => {
      mountedRenderers.current.forEach((renderer) => {
        renderer.root.unmount();
      });
      mountedRenderers.current.clear();
      KritzelCustomElementRendererRegistry.unregister(TODO_RENDERER_KEY);
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
    placeholder.textContent = "Loading Todo List...";

    const customElement = new KritzelCustomElement({
      element: placeholder,
      rendererKey: TODO_RENDERER_KEY,
      rendererData: createTodoListInitialState(),
      translateX: -300,
      translateY: -180,
      width: 600,
      height: 380,
    });

    customElement.isRotatable = false;

    await editorRef.current?.addObject(customElement);
  }

  return (
    <div style={hostStyle}>
      <KritzelEditor
        ref={editorRef}
        editorId="react-custom-elements"
        theme="react-theme"
        themes={[customReactTheme]}
        style={editorStyle}
        onIsReady={() => {
          void onReady();
        }}
      />
    </div>
  );
}
