import "./App.css";
import { KritzelEditor, KritzelImage } from "kritzel-react";

function App() {
  let editor: HTMLKritzelEditorElement | null = null;

  async function onIsReady(
    event: CustomEvent<HTMLKritzelEditorElement>
  ): Promise<void> {
    editor = event.detail;

    const img = new Image();
    img.src = "https://placehold.co/600x400";

    await new Promise<void>((resolve) => {
      img.onload = () => resolve();
    });

    const image = new KritzelImage({
      src: img.src,
      x: 0,
      y: 0,
      translateX: 0,
      translateY: 0,
    });

    const { scaledWidth, scaledHeight } = image.calculateScaledDimensions(img);
    image.width = scaledWidth;
    image.height = scaledHeight;

    editor.addObject(image);
    editor.centerObjectInViewport(image);
    editor.selectAllObjectsInViewport();
  }

  return (
    <div className="app">
      <KritzelEditor onIsReady={onIsReady}></KritzelEditor>;
    </div>
  );
}

export default App;
