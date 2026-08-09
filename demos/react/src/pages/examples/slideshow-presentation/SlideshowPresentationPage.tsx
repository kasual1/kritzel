import { useRef, useState, type CSSProperties } from "react";
import {
  KritzelEditor,
  KritzelShape,
  KritzelText,
  ShapeType,
  type HTMLKritzelEditorElement,
} from "kritzel-react";
import { reactThemeLight } from "../../../const/react-theme-light";

interface Slide {
  title: string;
  centerX: number;
  centerY: number;
}

const slides: Slide[] = [
  { title: "1. Welcome to Kritzel", centerX: 0, centerY: 0 },
  { title: "2. Core Frontend Capabilities", centerX: 1200, centerY: 0 },
  { title: "3. Seamless Presentation Layout", centerX: 2400, centerY: 0 },
];

const hostStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  height: "100%",
  fontFamily: "Inter, Segoe UI, sans-serif",
  background:
    "linear-gradient(180deg, rgba(245, 250, 252, 1) 0%, rgba(235, 246, 250, 1) 100%)",
};

const headerStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  padding: "12px 24px",
  background: "#ffffff",
  borderBottom: "1px solid #d8e8ee",
  boxShadow: "0 1px 3px rgba(8, 126, 164, 0.06)",
};

const badgeStyle: CSSProperties = {
  alignSelf: "flex-start",
  fontSize: "11px",
  fontWeight: 700,
  textTransform: "uppercase",
  backgroundColor: "rgba(8, 126, 164, 0.1)",
  color: "#087ea4",
  padding: "2px 8px",
  borderRadius: "99px",
  letterSpacing: "0.5px",
};

const titleStyle: CSSProperties = {
  margin: 0,
  fontSize: "20px",
  fontWeight: 600,
  color: "#16313c",
};

const navButtonsStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "12px",
  background: "rgba(8, 126, 164, 0.08)",
  padding: "4px",
  borderRadius: "8px",
};

const slideIndicatorStyle: CSSProperties = {
  fontSize: "13px",
  color: "#416173",
  minWidth: "90px",
  textAlign: "center",
};

const editorContainerStyle: CSSProperties = {
  flex: 1,
  position: "relative",
};

const editorStyle: CSSProperties = {
  display: "block",
  width: "100%",
  height: "100%",
};

function navButtonStyle(disabled: boolean): CSSProperties {
  return {
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    padding: "6px 16px",
    border: "1px solid #cfe0e7",
    borderRadius: "6px",
    background: "#ffffff",
    cursor: disabled ? "not-allowed" : "pointer",
    fontSize: "13px",
    fontWeight: 500,
    color: disabled ? "#8aa0aa" : "#087ea4",
    boxShadow: disabled ? "none" : "0 1px 2px rgba(8, 126, 164, 0.08)",
    opacity: disabled ? 0.5 : 1,
    transition: "all 0.2s ease",
  };
}

export function SlideshowPresentationPage() {
  const editorRef = useRef<HTMLKritzelEditorElement | null>(null);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);

  async function seedSlides(editor: HTMLKritzelEditorElement) {
    // Slide 1 Background Frame and Content
    await editor.addObject(
      new KritzelShape({
        translateX: -400,
        translateY: -225,
        width: 800,
        height: 450,
        shapeType: ShapeType.Rectangle,
        fillColor: { light: "#ffffff", dark: "#1b1b1e" },
        strokeColor: { light: "#087ea4", dark: "#065d7a" },
        strokeWidth: 4,
      }),
    );

    await editor.addObject(
      new KritzelText({
        text: "Welcome to Kritzel",
        translateX: -350,
        translateY: -150,
        fontSize: 36,
        fontColor: { light: "#087ea4", dark: "#4dd0e1" },
      }),
    );

    await editor.addObject(
      new KritzelText({
        text: "A modern vector drawing component for web builders. This workspace demonstrates Slideshow Mode, spacing slide sheets on a virtual horizontal track.\n\nUse the presentation controls above to glide smoothly between slides!",
        translateX: -350,
        translateY: -50,
        fontSize: 20,
        fontColor: { light: "#333333", dark: "#eeeeee" },
      }),
    );

    // Decorative shape Slide 1
    await editor.addObject(
      new KritzelShape({
        translateX: 200,
        translateY: 50,
        width: 120,
        height: 120,
        shapeType: ShapeType.Ellipse,
        fillColor: { light: "#e3f2fd", dark: "#1a237e" },
        strokeColor: { light: "#1565c0", dark: "#90caf9" },
        strokeWidth: 2,
      }),
    );

    // Slide 2 Background Frame and Content
    await editor.addObject(
      new KritzelShape({
        translateX: 800,
        translateY: -225,
        width: 800,
        height: 450,
        shapeType: ShapeType.Rectangle,
        fillColor: { light: "#ffffff", dark: "#1b1b1e" },
        strokeColor: { light: "#087ea4", dark: "#065d7a" },
        strokeWidth: 4,
      }),
    );

    await editor.addObject(
      new KritzelText({
        text: "Core Frontend Power",
        translateX: 850,
        translateY: -150,
        fontSize: 36,
        fontColor: { light: "#087ea4", dark: "#4dd0e1" },
      }),
    );

    await editor.addObject(
      new KritzelText({
        text: "• Offline-First Canvas Persistence\n• Dynamic Viewport & Navigation Helpers\n• Tailored Custom Color Tool Palettes\n• Entirely Interactive Drawing Tools",
        translateX: 850,
        translateY: -50,
        fontSize: 20,
        fontColor: { light: "#333333", dark: "#eeeeee" },
      }),
    );

    // Decorative shape Slide 2
    await editor.addObject(
      new KritzelShape({
        translateX: 1400,
        translateY: 50,
        width: 120,
        height: 100,
        shapeType: ShapeType.Triangle,
        fillColor: { light: "#fce4ec", dark: "#880e4f" },
        strokeColor: { light: "#c62828", dark: "#ef9a9a" },
        strokeWidth: 2,
      }),
    );

    // Slide 3 Background Frame and Content
    await editor.addObject(
      new KritzelShape({
        translateX: 2000,
        translateY: -225,
        width: 800,
        height: 450,
        shapeType: ShapeType.Rectangle,
        fillColor: { light: "#ffffff", dark: "#1b1b1e" },
        strokeColor: { light: "#087ea4", dark: "#065d7a" },
        strokeWidth: 4,
      }),
    );

    await editor.addObject(
      new KritzelText({
        text: "Seamless Bounded Layouts",
        translateX: 2050,
        translateY: -150,
        fontSize: 36,
        fontColor: { light: "#087ea4", dark: "#4dd0e1" },
      }),
    );

    await editor.addObject(
      new KritzelText({
        text: "By setting finite limits on the viewport bounds, the user can draw and interact inside the slide card, but cannot pan away to empty space.\n\nCombined with pan animation flows, this makes a wonderful presentation experience.",
        translateX: 2050,
        translateY: -50,
        fontSize: 20,
        fontColor: { light: "#333333", dark: "#eeeeee" },
      }),
    );

    // Decorative shape Slide 3
    await editor.addObject(
      new KritzelShape({
        translateX: 2600,
        translateY: 50,
        width: 100,
        height: 100,
        shapeType: ShapeType.Rectangle,
        fillColor: { light: "#e8f5e9", dark: "#1b5e20" },
        strokeColor: { light: "#2e7d32", dark: "#a5d6a7" },
        strokeWidth: 2,
      }),
    );
  }

  async function navigateToSlide(index: number) {
    const slide = slides[index];
    await editorRef.current?.setViewport(slide.centerX, slide.centerY, 1);
  }

  async function onReady() {
    const editor = editorRef.current;
    if (!editor) {
      return;
    }

    const existing = await editor.getAllObjects();
    if (existing.length === 0) {
      await seedSlides(editor);
    }

    await navigateToSlide(0);
  }

  async function goToPrevSlide() {
    if (currentSlideIndex > 0) {
      const targetIndex = currentSlideIndex - 1;
      setCurrentSlideIndex(targetIndex);
      await navigateToSlide(targetIndex);
    }
  }

  async function goToNextSlide() {
    if (currentSlideIndex < slides.length - 1) {
      const targetIndex = currentSlideIndex + 1;
      setCurrentSlideIndex(targetIndex);
      await navigateToSlide(targetIndex);
    }
  }

  return (
    <div style={hostStyle}>
      <header style={headerStyle}>
        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          <span style={badgeStyle}>Presentation Mode</span>
          <h1 style={titleStyle}>Interactive Slideshow</h1>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "24px" }}>
          <div style={navButtonsStyle}>
            <button
              style={navButtonStyle(currentSlideIndex === 0)}
              disabled={currentSlideIndex === 0}
              onClick={() => void goToPrevSlide()}
            >
              Previous
            </button>
            <span style={slideIndicatorStyle}>
              Slide <strong>{currentSlideIndex + 1}</strong> of {slides.length}
            </span>
            <button
              style={navButtonStyle(currentSlideIndex === slides.length - 1)}
              disabled={currentSlideIndex === slides.length - 1}
              onClick={() => void goToNextSlide()}
            >
              Next
            </button>
          </div>
        </div>
      </header>

      <div style={editorContainerStyle}>
        <KritzelEditor
          ref={editorRef}
          editorId="slideshow-presentation"
          theme="light"
          themes={[reactThemeLight]}
          isPanningEnabled={false}
          isZoomingEnabled={false}
          isControlsVisible={false}
          isMoreMenuVisible={false}
          isWorkspaceManagerVisible={false}
          onIsReady={() => {
            void onReady();
          }}
          style={editorStyle}
        />
      </div>
    </div>
  );
}
