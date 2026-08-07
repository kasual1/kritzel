import { useRef, useState, type CSSProperties, type MouseEvent } from "react";
import {
  KritzelEditor,
  KritzelImage,
  KritzelShape,
  ShapeType,
  type HTMLKritzelEditorElement,
  type ThemeAwareColor,
} from "kritzel-react";
import { reactThemeLight } from "../../../const/react-theme-light";

type DefectStatus = "Outstanding" | "In Progress" | "Resolved";

interface Defect {
  id: string;
  title: string;
  category: string;
  x: number;
  y: number;
  status: DefectStatus;
  pinId: string;
}

const PIN_SIZE = 30;
const FIRST_SEED_PIN_CENTER = { x: -60, y: 145 };
const SECOND_SEED_PIN_CENTER = { x: 135, y: -80 };

function getPinColor(status: DefectStatus): ThemeAwareColor {
  if (status === "Outstanding") return { light: "#dd0031", dark: "#ef4444" };
  if (status === "In Progress") return { light: "#f59e0b", dark: "#f59e0b" };
  return { light: "#10b981", dark: "#10b981" };
}

const hostStyle: CSSProperties = {
  display: "flex",
  height: "100%",
  width: "100%",
  fontFamily: "Inter, Segoe UI, sans-serif",
  background:
    "linear-gradient(180deg, rgba(245, 250, 252, 1) 0%, rgba(235, 246, 250, 1) 100%)",
};

const editorPaneStyle: CSSProperties = {
  flex: 1,
  position: "relative",
  height: "100%",
};

const editorStyle: CSSProperties = {
  display: "block",
  width: "100%",
  height: "100%",
};

const placingToastStyle: CSSProperties = {
  position: "absolute",
  top: "16px",
  left: "50%",
  transform: "translateX(-50%)",
  background: "rgba(8, 126, 164, 0.96)",
  color: "white",
  padding: "8px 20px",
  borderRadius: "99px",
  fontSize: "13px",
  fontWeight: 500,
  boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
  zIndex: 10,
  border: "1px solid rgba(255, 255, 255, 0.2)",
};

const sidebarStyle: CSSProperties = {
  width: "320px",
  borderLeft: "1px solid #d8e8ee",
  background: "#ffffff",
  display: "flex",
  flexDirection: "column",
  height: "100%",
  boxShadow: "-1px 0 3px rgba(8, 126, 164, 0.05)",
};

const sidebarHeaderStyle: CSSProperties = {
  padding: "16px",
  borderBottom: "1px solid #d8e8ee",
};

const badgeStyle: CSSProperties = {
  display: "inline-block",
  fontSize: "11px",
  fontWeight: 700,
  textTransform: "uppercase",
  backgroundColor: "rgba(8, 126, 164, 0.1)",
  color: "#087ea4",
  padding: "2px 8px",
  borderRadius: "99px",
  letterSpacing: "0.5px",
  marginBottom: "6px",
};

const mapControlsStyle: CSSProperties = {
  display: "flex",
  gap: "8px",
  padding: "12px 16px",
  background: "rgba(8, 126, 164, 0.03)",
  borderBottom: "1px solid #d8e8ee",
};

function actionBtnStyle(active: boolean): CSSProperties {
  return {
    flex: 1,
    padding: "8px 12px",
    border: "1px solid #087ea4",
    borderRadius: "6px",
    background: active ? "#087ea4" : "#ffffff",
    color: active ? "#ffffff" : "#087ea4",
    fontSize: "13px",
    fontWeight: 600,
    cursor: "pointer",
    transition: "all 0.15s ease",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  };
}

const resetBtnStyle: CSSProperties = {
  padding: "8px 12px",
  border: "1px solid #cfe0e7",
  borderRadius: "6px",
  background: "#ffffff",
  color: "#065d7a",
  fontSize: "13px",
  fontWeight: 500,
  cursor: "pointer",
  transition: "all 0.15s ease",
};

const defectsListStyle: CSSProperties = {
  flex: 1,
  overflowY: "auto",
  padding: "0 16px 16px 16px",
  display: "flex",
  flexDirection: "column",
  gap: "12px",
};

const emptyListStyle: CSSProperties = {
  padding: "32px 16px",
  textAlign: "center",
  color: "#5b7180",
  fontSize: "13px",
  border: "1px dashed #cfe0e7",
  borderRadius: "8px",
};

const defectCardStyle: CSSProperties = {
  border: "1px solid #d8e8ee",
  borderRadius: "8px",
  padding: "10px 12px",
  cursor: "pointer",
  transition: "all 0.15s ease",
  background: "#ffffff",
};

const statusColors: Record<DefectStatus, string> = {
  Outstanding: "#087ea4",
  "In Progress": "#f59e0b",
  Resolved: "#10b981",
};

export function BlueprintDefectMapperPage() {
  const editorRef = useRef<HTMLKritzelEditorElement | null>(null);
  const nextDefectId = useRef(2);

  const [placingMode, setPlacingMode] = useState(false);
  const [defects, setDefects] = useState<Defect[]>([]);

  async function initializeBlueprint(editor: HTMLKritzelEditorElement) {
    // 1. Load floorplan.png from local assets as unselectable background scenery
    const bg = await KritzelImage.fromUrl("floorplan.png", {
      maxWidth: 660,
      maxHeight: 360,
    });

    bg.translateX = -bg.width / 2;
    bg.translateY = -bg.height / 2;
    await editor.addObject(bg);

    // 2. Seed initial reported defects onto floor plan
    const seedPins = [
      {
        id: "defect-1",
        title: "Kitchen Sink Drain Clog",
        category: "Plumbing",
        x: FIRST_SEED_PIN_CENTER.x,
        y: FIRST_SEED_PIN_CENTER.y,
        status: "Outstanding" as const,
      },
      {
        id: "defect-2",
        title: "Bathroom Toilet Running",
        category: "Plumbing",
        x: SECOND_SEED_PIN_CENTER.x,
        y: SECOND_SEED_PIN_CENTER.y,
        status: "In Progress" as const,
      },
    ];

    const initialList: Defect[] = [];

    for (const d of seedPins) {
      const pinId = `pin-${d.id}`;
      const pin = new KritzelShape({
        translateX: d.x - PIN_SIZE / 2,
        translateY: d.y - PIN_SIZE / 2,
        width: PIN_SIZE,
        height: PIN_SIZE,
        shapeType: ShapeType.Ellipse,
        fillColor: getPinColor(d.status),
        strokeColor: { light: "#ffffff", dark: "#ffffff" },
        strokeWidth: 2,
      });
      pin.id = pinId;
      pin.isEditable = false;
      await editor.addObject(pin);

      initialList.push({
        id: d.id,
        title: d.title,
        category: d.category,
        x: d.x,
        y: d.y,
        status: d.status,
        pinId,
      });
    }

    setDefects(initialList);
  }

  async function restoreDefectsFromCanvas(editor: HTMLKritzelEditorElement) {
    const all = await editor.getAllObjects();
    const pinObjects = all.filter(
      (o) => o.id.startsWith("pin-") && o instanceof KritzelShape,
    ) as KritzelShape[];

    const restoredList: Defect[] = [];
    pinObjects.forEach((pin) => {
      const parts = pin.id.split("-");
      const id = parts.slice(1).join("-");

      let status: DefectStatus = "Outstanding";
      const fillLight = (pin.fillColor as ThemeAwareColor)?.light;
      if (fillLight === "#f59e0b") {
        status = "In Progress";
      } else if (fillLight === "#10b981") {
        status = "Resolved";
      }

      let title = "Defect";
      let category = "Facility";
      if (id === "defect-1") {
        title = "Kitchen Sink Drain Clog";
        category = "Plumbing";
      } else if (id === "defect-2") {
        title = "Bathroom Toilet Running";
        category = "Plumbing";
      } else if (id === "defect-3") {
        title = "Exposed Electrical Terminal";
        category = "Electrical";
      } else {
        title = `Pinned Defect ${id}`;
        category = "Manual";
      }

      const isFirstSeedPin = pin.id === "pin-defect-1";
      const isSecondSeedPin = pin.id === "pin-defect-2";
      restoredList.push({
        id: id || pin.id,
        title,
        category,
        x: isFirstSeedPin
          ? FIRST_SEED_PIN_CENTER.x
          : isSecondSeedPin
            ? SECOND_SEED_PIN_CENTER.x
            : Math.round(pin.translateX + pin.width / 2),
        y: isFirstSeedPin
          ? FIRST_SEED_PIN_CENTER.y
          : isSecondSeedPin
            ? SECOND_SEED_PIN_CENTER.y
            : Math.round(pin.translateY + pin.height / 2),
        status,
        pinId: pin.id,
      });
    });

    setDefects(restoredList);
  }

  async function normalizeSeedPin(
    editor: HTMLKritzelEditorElement,
    pinId: string,
    center: { x: number; y: number },
  ) {
    const pin = (await editor.getObjectById(pinId)) as KritzelShape | undefined;
    if (!pin) {
      return;
    }

    await editor.updateObject(pin, {
      translateX: center.x - PIN_SIZE / 2,
      translateY: center.y - PIN_SIZE / 2,
      width: PIN_SIZE,
      height: PIN_SIZE,
    });
  }

  async function onReady() {
    const editor = editorRef.current;
    if (!editor) {
      return;
    }

    const existing = await editor.getAllObjects();
    if (existing.length === 0) {
      await initializeBlueprint(editor);
    } else {
      await restoreDefectsFromCanvas(editor);
    }

    await normalizeSeedPin(editor, "pin-defect-1", FIRST_SEED_PIN_CENTER);
    await normalizeSeedPin(editor, "pin-defect-2", SECOND_SEED_PIN_CENTER);
  }

  function togglePlacingMode() {
    const newMode = !placingMode;
    setPlacingMode(newMode);
    if (newMode) {
      // Force the selection tool to prevent drawing marks while dropping a pin
      void editorRef.current?.changeActiveToolByName("select");
    }
  }

  async function onCanvasClick(event: MouseEvent<HTMLDivElement>) {
    const editor = editorRef.current;
    if (!placingMode || !editor) {
      return;
    }

    const rect = editor.getBoundingClientRect();
    const screenX = event.clientX - rect.left;
    const screenY = event.clientY - rect.top;

    // Convert screen pointer location into real-world blueprint units
    const worldPos = await editor.screenToWorld(screenX, screenY);

    const defectId = `defect-user-${++nextDefectId.current}`;
    const pinId = `pin-${defectId}`;

    const pin = new KritzelShape({
      translateX: worldPos.x - PIN_SIZE / 2,
      translateY: worldPos.y - PIN_SIZE / 2,
      width: PIN_SIZE,
      height: PIN_SIZE,
      shapeType: ShapeType.Ellipse,
      fillColor: getPinColor("Outstanding"),
      strokeColor: { light: "#ffffff", dark: "#ffffff" },
      strokeWidth: 2,
    });
    pin.id = pinId;
    pin.isEditable = false;

    await editor.addObject(pin);

    const newDefect: Defect = {
      id: defectId,
      title: `Defect #${nextDefectId.current}`,
      category: "Manual Pin",
      x: Math.round(worldPos.x),
      y: Math.round(worldPos.y),
      status: "Outstanding",
      pinId,
    };

    setDefects((list) => [...list, newDefect]);
    setPlacingMode(false);
  }

  async function zoomToDefect(defect: Defect) {
    await editorRef.current?.setViewport(defect.x, defect.y, 1.25);
  }

  async function resetView() {
    await editorRef.current?.setViewport(0, 0, 1);
  }

  async function changeDefectStatus(defect: Defect, newStatus: DefectStatus) {
    setDefects((list) =>
      list.map((d) => (d.id === defect.id ? { ...d, status: newStatus } : d)),
    );

    const pin = (await editorRef.current?.getObjectById(defect.pinId)) as
      | KritzelShape
      | undefined;
    if (pin) {
      await editorRef.current?.updateObject(pin, {
        fillColor: getPinColor(newStatus),
      });
    }
  }

  async function findPinsForDefect(defect: Defect): Promise<KritzelShape[]> {
    const editor = editorRef.current;
    if (!editor) {
      return [];
    }

    const idCandidates = Array.from(
      new Set([defect.pinId, `pin-${defect.id}`, defect.id]),
    );

    const directMatches: KritzelShape[] = [];
    for (const id of idCandidates) {
      const pin = (await editor.getObjectById(id)) as KritzelShape | null;
      if (pin && pin instanceof KritzelShape && pin.shapeType === ShapeType.Ellipse) {
        directMatches.push(pin);
      }
    }

    if (directMatches.length > 0) {
      return directMatches;
    }

    const all = await editor.getAllObjects();
    const idMatches = all.filter(
      (obj) =>
        obj instanceof KritzelShape &&
        obj.shapeType === ShapeType.Ellipse &&
        idCandidates.includes(obj.id),
    ) as KritzelShape[];

    if (idMatches.length > 0) {
      return idMatches;
    }

    // Fallback for legacy/persisted IDs: match the nearest pin to the defect coordinates.
    const ellipsePins = all.filter(
      (obj) => obj instanceof KritzelShape && obj.shapeType === ShapeType.Ellipse,
    ) as KritzelShape[];

    const maxDistance = PIN_SIZE;
    let bestMatch: KritzelShape | null = null;
    let bestDistance = Number.POSITIVE_INFINITY;

    for (const pin of ellipsePins) {
      const centerX = pin.translateX + pin.width / 2;
      const centerY = pin.translateY + pin.height / 2;
      const distance = Math.hypot(centerX - defect.x, centerY - defect.y);
      if (distance <= maxDistance && distance < bestDistance) {
        bestMatch = pin;
        bestDistance = distance;
      }
    }

    return bestMatch ? [bestMatch] : [];
  }

  async function deleteDefect(defect: Defect, event: MouseEvent) {
    event.stopPropagation();

    const pins = await findPinsForDefect(defect);
    if (pins.length === 1) {
      await editorRef.current?.removeObject(pins[0]);
    } else if (pins.length > 1) {
      await editorRef.current?.removeObjects(pins);
    }

    setDefects((list) => list.filter((d) => d.id !== defect.id));
  }

  return (
    <div style={hostStyle}>
      <div style={editorPaneStyle} onClick={(event) => void onCanvasClick(event)}>
        <KritzelEditor
          ref={editorRef}
          editorId="blueprint-defect-mapper"
          theme="react-theme"
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

        {placingMode && (
          <div style={placingToastStyle}>
            Click anywhere on the blueprint to place a defect pin
          </div>
        )}
      </div>

      <aside style={sidebarStyle}>
        <div style={sidebarHeaderStyle}>
          <span style={badgeStyle}>Facilities</span>
          <h2 style={{ margin: "0 0 4px 0", fontSize: "18px", fontWeight: 600, color: "#333333" }}>
            Blueprint Defect Mapper
          </h2>
          <p style={{ margin: 0, fontSize: "12px", color: "#666666", lineHeight: 1.4 }}>
            Report and monitor structural defects directly onto floor plan blueprints.
          </p>
        </div>

        <div style={mapControlsStyle}>
          <button style={actionBtnStyle(placingMode)} onClick={() => togglePlacingMode()}>
            {placingMode ? "Cancel Pin Placement" : "Place New Defect Pin"}
          </button>
          <button style={resetBtnStyle} onClick={() => void resetView()}>
            Reset Zoom
          </button>
        </div>

        <div style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
          <div style={{ padding: "12px 16px 8px 16px" }}>
            <h3 style={{ margin: 0, fontSize: "14px", color: "#333", fontWeight: 600 }}>
              Reported Defects ({defects.length})
            </h3>
          </div>

          <div style={defectsListStyle}>
            {defects.length === 0 ? (
              <div style={emptyListStyle}>
                No defects reported. Click "Place New Defect Pin" to report site defects.
              </div>
            ) : (
              defects.map((d) => (
                <div key={d.id} style={defectCardStyle} onClick={() => void zoomToDefect(d)}>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "6px" }}>
                    <span
                      style={{
                        width: "8px",
                        height: "8px",
                        borderRadius: "50%",
                        flexShrink: 0,
                        backgroundColor: statusColors[d.status],
                      }}
                    />
                    <span
                      style={{
                        fontSize: "13px",
                        fontWeight: 600,
                        color: "#1e293b",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        flex: 1,
                      }}
                    >
                      {d.title}
                    </span>
                    <span
                      style={{
                        fontSize: "10px",
                        background: "#f1f5f9",
                        color: "#475569",
                        padding: "2px 6px",
                        borderRadius: "99px",
                        fontWeight: 500,
                      }}
                    >
                      {d.category}
                    </span>
                  </div>
                  <div style={{ fontSize: "11px", color: "#64748b", marginBottom: "8px", fontFamily: "monospace" }}>
                    Units: x: {d.x}, y: {d.y}
                  </div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: "8px",
                      borderTop: "1px solid #f1f5f9",
                      paddingTop: "8px",
                    }}
                  >
                    <select
                      value={d.status}
                      onClick={(event) => event.stopPropagation()}
                      onChange={(event) =>
                        void changeDefectStatus(d, event.target.value as DefectStatus)
                      }
                      style={{
                        fontSize: "11px",
                        padding: "3px 6px",
                        border: "1px solid #ccc",
                        borderRadius: "4px",
                        background: "white",
                        color: "#333",
                      }}
                    >
                      <option value="Outstanding">Outstanding</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Resolved">Resolved</option>
                    </select>
                    <button
                      style={{
                        fontSize: "11px",
                        color: "#64748b",
                        border: "none",
                        background: "transparent",
                        cursor: "pointer",
                        padding: "2px 4px",
                      }}
                      onClick={(event) => void deleteDefect(d, event)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </aside>
    </div>
  );
}
