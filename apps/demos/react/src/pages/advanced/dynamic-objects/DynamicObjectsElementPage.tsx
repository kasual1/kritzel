import { useEffect, useRef } from "react";
import { createRoot, type Root } from "react-dom/client";
import {
  KritzelDynamicObject,
  KritzelEditor,
  type HTMLKritzelEditorElement,
} from "@kritzel/react-editor";
import { KritzelDynamicObjectRendererRegistry } from "@kritzel/react-editor";
import { reactThemeLight } from "../../../const/react-theme-light";
import { editorStyle, hostStyle } from "../../shared/demo-shared";
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

export function DynamicObjectsElementPage() {
  const editorRef = useRef<HTMLKritzelEditorElement | null>(null);
  const hasAddedInitialDynamicObject = useRef(false);
  const mountedRenderers = useRef<Map<string, MountedTodoRenderer>>(new Map());

  useEffect(() => {
    KritzelDynamicObjectRendererRegistry.register(TODO_RENDERER_KEY, {
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
      KritzelDynamicObjectRendererRegistry.unregister(TODO_RENDERER_KEY);
    };
  }, []);

  async function onReady() {
    if (hasAddedInitialDynamicObject.current) {
      return;
    }

    const objectCount = await editorRef.current?.getObjectsTotalCount();
    if ((objectCount ?? 0) > 0) {
      return;
    }

    hasAddedInitialDynamicObject.current = true;

    const placeholder = document.createElement("div");
    placeholder.textContent = "Loading Todo List...";

    const dynamicObject = new KritzelDynamicObject({
      element: placeholder,
      rendererKey: TODO_RENDERER_KEY,
      rendererData: createTodoListInitialState(),
      translateX: -300,
      translateY: -180,
      width: 600,
      height: 380,
    });

    dynamicObject.isRotatable = false;

    await editorRef.current?.addObject(dynamicObject);
  }

  return (
    <div style={hostStyle}>
      <KritzelEditor
        ref={editorRef}
        editorId="react-dynamic-objects"
        theme="light"
        themes={[reactThemeLight]}
        style={editorStyle}
        onIsReady={() => {
          void onReady();
        }}
      />
    </div>
  );
}
