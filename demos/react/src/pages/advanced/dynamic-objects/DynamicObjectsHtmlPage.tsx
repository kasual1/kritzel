import { useRef } from "react";
import { KritzelDynamicObject, KritzelEditor, type HTMLKritzelEditorElement } from "@kritzel/react-editor";
import { reactThemeLight } from "../../../const/react-theme-light";

function createHtmlCounterElement(): HTMLElement {
  const root = document.createElement("section");
  root.style.cssText = "display:flex;flex-direction:column;gap:10px;padding:14px;box-sizing:border-box;height:100%;font-family:sans-serif;";

  const heading = document.createElement("h3");
  heading.textContent = "Native HTML Counter";
  heading.style.cssText = "margin:0;font-size:15px;";

  const note = document.createElement("p");
  note.textContent = "This content is plain DOM passed directly as the element, with no renderer.";
  note.style.cssText = "margin:0;font-size:12px;color:#555;";

  const controls = document.createElement("div");
  controls.style.cssText = "display:flex;align-items:center;gap:12px;margin-top:auto;";

  const decrementButton = document.createElement("button");
  decrementButton.type = "button";
  decrementButton.textContent = "-";

  const countLabel = document.createElement("span");
  countLabel.style.cssText = "font-size:20px;font-weight:700;min-width:24px;text-align:center;";

  const incrementButton = document.createElement("button");
  incrementButton.type = "button";
  incrementButton.textContent = "+";

  [decrementButton, incrementButton].forEach((button) => {
    button.style.cssText =
      "width:32px;height:32px;border-radius:6px;border:1px solid #61dafb;background:#ffffff;color:#0f172a;cursor:pointer;font-size:16px;";
  });

  let count = 0;
  const renderCount = () => {
    countLabel.textContent = String(count);
  };
  renderCount();

  incrementButton.addEventListener("click", () => {
    count += 1;
    renderCount();
  });
  decrementButton.addEventListener("click", () => {
    count -= 1;
    renderCount();
  });

  controls.appendChild(decrementButton);
  controls.appendChild(countLabel);
  controls.appendChild(incrementButton);

  root.appendChild(heading);
  root.appendChild(note);
  root.appendChild(controls);

  return root;
}

export function DynamicObjectsHtmlPage() {
  const editorRef = useRef<HTMLKritzelEditorElement | null>(null);
  const hasAddedInitialDynamicObject = useRef(false);

  async function onReady() {
    if (hasAddedInitialDynamicObject.current) {
      return;
    }

    const objectCount = await editorRef.current?.getObjectsTotalCount();
    if ((objectCount ?? 0) > 0) {
      return;
    }

    hasAddedInitialDynamicObject.current = true;

    const dynamicObject = new KritzelDynamicObject({
      element: createHtmlCounterElement(),
      translateX: -150,
      translateY: -90,
      width: 260,
      height: 160,
    });

    dynamicObject.isRotatable = false;

    await editorRef.current?.addObject(dynamicObject);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", fontFamily: "sans-serif" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, padding: 8, background: "#f5f5f5", borderBottom: "1px solid #ddd" }}>
        <strong>Native HTML:</strong>
        <span>The object mounts a plain DOM element with no renderer registered.</span>
      </div>
      <KritzelEditor
        ref={editorRef}
        editorId="dynamic-objects-html"
        theme="light"
        themes={[reactThemeLight]}
        isPanningEnabled={false}
        isZoomingEnabled={false}
        isMoreMenuVisible={false}
        isWorkspaceManagerVisible={false}
        onIsReady={() => {
          void onReady();
        }}
        style={{ flex: 1, minHeight: 0 }}
      />
    </div>
  );
}
