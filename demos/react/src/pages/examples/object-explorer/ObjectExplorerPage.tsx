import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type CSSProperties,
  type MouseEvent as ReactMouseEvent,
} from "react";
import {
  KritzelEditor,
  ShapeType,
  type HTMLKritzelEditorElement,
  type KritzelBaseObject,
  type KritzelSyncConfig,
  type ObjectsAddedEvent,
  type ObjectsRemovedEvent,
  type ObjectsUpdatedEvent,
} from "kritzel-react";
import { reactThemeLight } from "../../../const/react-theme-light";
import { createSeedObjects } from "../../basic-usage/seed-objects";

type AnyObject = KritzelBaseObject<HTMLElement | SVGElement> & Record<string, any>;

const AVAILABLE_TYPES = ["KritzelShape", "KritzelText", "KritzelLine", "KritzelPath"];

const hostStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  height: "100%",
  fontFamily: "Inter, Segoe UI, sans-serif",
  background:
    "linear-gradient(180deg, rgba(245, 250, 252, 1) 0%, rgba(235, 246, 250, 1) 100%)",
  color: "#16313c",
};

const contentShellStyle: CSSProperties = {
  display: "flex",
  flex: 1,
  minHeight: 0,
};

const editorContainerStyle: CSSProperties = {
  flex: 1,
  minWidth: 0,
};

const editorStyle: CSSProperties = {
  display: "block",
  width: "100%",
  height: "100%",
};

const asideStyle: CSSProperties = {
  width: "340px",
  overflowY: "auto",
  borderLeft: "1px solid #d8e8ee",
  backgroundColor: "#ffffff",
  padding: "12px",
  fontSize: "13px",
  display: "flex",
  flexDirection: "column",
  gap: "12px",
};

const taglineStyle: CSSProperties = {
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

const sectionHeadingStyle: CSSProperties = {
  margin: "0 0 8px 0",
  fontSize: "12px",
  color: "#416173",
  textTransform: "uppercase",
  letterSpacing: "0.5px",
};

const searchInputStyle: CSSProperties = {
  width: "100%",
  boxSizing: "border-box",
  padding: "6px 8px",
  border: "1px solid #cfe0e7",
  borderRadius: "4px",
  marginBottom: "10px",
  fontSize: "12px",
};

const treeContainerStyle: CSSProperties = {
  maxHeight: "320px",
  overflowY: "auto",
  border: "1px solid #d8e8ee",
  borderRadius: "4px",
  background: "rgba(8, 126, 164, 0.02)",
  padding: "4px",
};

const inspectorStyle: CSSProperties = {
  background: "rgba(8, 126, 164, 0.02)",
  padding: "10px",
  borderRadius: "4px",
  border: "1px solid #d8e8ee",
};

const inspectorFieldStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "4px",
  marginBottom: "8px",
};

const inspectorLabelStyle: CSSProperties = {
  fontWeight: 600,
  color: "#49616f",
  fontSize: "11px",
  textTransform: "uppercase",
  letterSpacing: "0.2px",
};

const inspectorInputStyle: CSSProperties = {
  padding: "4px 6px",
  border: "1px solid #cfe0e7",
  borderRadius: "3px",
  fontSize: "12px",
  fontFamily: "inherit",
  color: "#16313c",
  background: "#ffffff",
};

function filterChipStyle(active: boolean): CSSProperties {
  return {
    padding: "4px 8px",
    fontSize: "11px",
    borderRadius: "12px",
    boxShadow: "none",
    border: `1px solid ${active ? "#087ea4" : "#d8e8ee"}`,
    background: active ? "#087ea4" : "rgba(8, 126, 164, 0.06)",
    color: active ? "#ffffff" : "#087ea4",
    cursor: "pointer",
    fontFamily: "inherit",
  };
}

function resolveThemeColor(raw: unknown, fallback: string): string {
  if (!raw) {
    return fallback;
  }
  if (typeof raw === "object") {
    const color = (raw as Record<string, string>).light || (raw as Record<string, string>).dark;
    if (typeof color === "string" && color.startsWith("#")) {
      return color;
    }
    return fallback;
  }
  if (typeof raw === "string" && raw.startsWith("#")) {
    return raw;
  }
  return fallback;
}

export function ObjectExplorerPage() {
  const editorRef = useRef<HTMLKritzelEditorElement | null>(null);
  const selectionListenerAttached = useRef(false);

  const syncConfig = useMemo<KritzelSyncConfig>(() => ({ providers: [] }), []);

  const [allObjects, setAllObjects] = useState<AnyObject[]>([]);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [selectedObject, setSelectedObject] = useState<AnyObject | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTypes, setSelectedTypes] = useState<Set<string>>(
    new Set([...AVAILABLE_TYPES, "KritzelGroup"]),
  );

  const childIds = useMemo(() => {
    const ids = new Set<string>();
    allObjects.forEach((obj) => {
      if (obj.__class__ === "KritzelGroup" && obj.childIds) {
        obj.childIds.forEach((id: string) => ids.add(id));
      }
    });
    return ids;
  }, [allObjects]);

  const rootObjects = useMemo(
    () => allObjects.filter((obj) => !childIds.has(obj.id)),
    [allObjects, childIds],
  );

  const getGroupChildren = useCallback(
    (groupObj: AnyObject): AnyObject[] => {
      if (!groupObj.childIds) {
        return [];
      }
      return allObjects.filter((o) => groupObj.childIds.includes(o.id));
    },
    [allObjects],
  );

  const matchesFilter = useCallback(
    (obj: AnyObject): boolean => {
      if (!selectedTypes.has(obj.__class__)) {
        return false;
      }

      const query = searchQuery.toLowerCase().trim();
      if (!query) {
        return true;
      }

      if (obj.id.toLowerCase().includes(query)) {
        return true;
      }
      if (obj.__class__.toLowerCase().includes(query)) {
        return true;
      }
      if (obj.__class__ === "KritzelText") {
        const txt = (obj.text as string) || "";
        if (txt.toLowerCase().includes(query)) {
          return true;
        }
      }
      if (obj.__class__ === "KritzelShape") {
        const shapeType = (obj.shapeType as string) || "";
        if (shapeType.toLowerCase().includes(query)) {
          return true;
        }
      }
      return false;
    },
    [selectedTypes, searchQuery],
  );

  const hasMatchingDescendant = useCallback(
    (groupObj: AnyObject): boolean => {
      const children = getGroupChildren(groupObj);
      for (const child of children) {
        if (matchesFilter(child)) {
          return true;
        }
        if (child.__class__ === "KritzelGroup" && hasMatchingDescendant(child)) {
          return true;
        }
      }
      return false;
    },
    [getGroupChildren, matchesFilter],
  );

  const isNodeVisible = useCallback(
    (obj: AnyObject): boolean =>
      matchesFilter(obj) ||
      (obj.__class__ === "KritzelGroup" && hasMatchingDescendant(obj)),
    [matchesFilter, hasMatchingDescendant],
  );

  const visibleRootsCount = useMemo(
    () => rootObjects.filter((root) => isNodeVisible(root)).length,
    [rootObjects, isNodeVisible],
  );

  async function applyTypeOpacityFilter(objects: AnyObject[], types: Set<string>) {
    const editor = editorRef.current;
    if (!editor) {
      return;
    }
    const updates = objects.map((obj) => {
      const targetOpacity = types.has(obj.__class__) ? 1 : 0.5;
      const currentOpacity = obj.opacity ?? 1;
      if (currentOpacity !== targetOpacity) {
        return editor.updateObject(obj, { opacity: targetOpacity });
      }
      return Promise.resolve();
    });
    await Promise.all(updates);
  }

  const syncInspectorWithSelection = useCallback(async () => {
    const selected = (await editorRef.current?.getSelectedObjects()) ?? [];
    setSelectedObject((selected[0] as AnyObject) ?? null);
  }, []);

  useEffect(() => {
    const editor = editorRef.current;
    if (!editor || selectionListenerAttached.current) {
      return;
    }

    const handler = () => {
      void syncInspectorWithSelection();
    };
    editor.addEventListener("objectsSelectionChange", handler);
    selectionListenerAttached.current = true;

    return () => {
      editor.removeEventListener("objectsSelectionChange", handler);
      selectionListenerAttached.current = false;
    };
  }, [syncInspectorWithSelection]);

  async function onReady() {
    const editor = editorRef.current;
    if (!editor) {
      return;
    }

    const existing = await editor.getAllObjects();
    if (existing.length === 0) {
      for (const obj of createSeedObjects()) {
        await editor.addObject(obj);
      }
    }
    const all = (await editor.getAllObjects()) as AnyObject[];
    setAllObjects([...all]);
    await applyTypeOpacityFilter(all, selectedTypes);
    await syncInspectorWithSelection();
  }

  function onObjectsAdded(event: CustomEvent<ObjectsAddedEvent>) {
    const added = event.detail.objects as AnyObject[];
    setAllObjects((prev) => {
      const next = [...prev, ...added];
      void applyTypeOpacityFilter(next, selectedTypes);
      return next;
    });
  }

  function onObjectsRemoved(event: CustomEvent<ObjectsRemovedEvent>) {
    const removedIds = new Set(event.detail.objects.map((o) => o.id));
    setAllObjects((prev) => prev.filter((o) => !removedIds.has(o.id)));
    setSelectedObject((active) => (active && removedIds.has(active.id) ? null : active));
  }

  function onObjectsUpdated(event: CustomEvent<ObjectsUpdatedEvent>) {
    const updatedMap = new Map(
      event.detail.objects.map((o) => [o.object.id, o.object as AnyObject]),
    );
    setAllObjects((prev) => prev.map((o) => updatedMap.get(o.id) || o));
    setSelectedObject((active) =>
      active && updatedMap.has(active.id) ? updatedMap.get(active.id)! : active,
    );
  }

  async function toggleTypeFilter(type: string) {
    const next = new Set(selectedTypes);
    if (next.has(type)) {
      next.delete(type);
    } else {
      next.add(type);
    }
    setSelectedTypes(next);
    await applyTypeOpacityFilter(allObjects, next);
  }

  function isExpanded(groupId: string): boolean {
    return expandedGroups.has(groupId);
  }

  function toggleExpand(event: ReactMouseEvent, obj: AnyObject) {
    event.stopPropagation();
    if (obj.__class__ !== "KritzelGroup") {
      return;
    }
    setExpandedGroups((groups) => {
      const next = new Set(groups);
      if (next.has(obj.id)) {
        next.delete(obj.id);
      } else {
        next.add(obj.id);
      }
      return next;
    });
  }

  function getDisplayName(obj: AnyObject): string {
    switch (obj.__class__) {
      case "KritzelGroup": {
        const count = obj.childIds?.length ?? 0;
        return `Group (${count} items)`;
      }
      case "KritzelShape":
        return obj.shapeType === ShapeType.Ellipse ? "Ellipse" : "Rectangle";
      case "KritzelText": {
        const txt = (obj.text as string) || "Blank Text";
        return `Text "${txt.length > 15 ? `${txt.slice(0, 15)}...` : txt}"`;
      }
      case "KritzelLine":
        return "Line";
      case "KritzelPath":
        return "Brush Path";
      default:
        return obj.__class__.replace("Kritzel", "");
    }
  }

  async function selectTreeObject(obj: AnyObject) {
    setSelectedObject(obj);
    await editorRef.current?.panToObject(obj);
    await editorRef.current?.selectObjects([obj]);
  }

  async function deleteTreeObject(event: ReactMouseEvent, obj: AnyObject) {
    event.stopPropagation();
    await editorRef.current?.removeObject(obj);
  }

  async function updateSelectedProperty(prop: string, event: ChangeEvent<HTMLInputElement>) {
    const active = selectedObject;
    if (!active) {
      return;
    }

    let value: string | number;
    if (event.target.type === "number" || event.target.type === "range") {
      value = parseFloat(event.target.value);
    } else {
      value = event.target.value;
    }

    const payload: Record<string, unknown> = {};
    if (prop === "fillColor" || prop === "fill" || prop === "stroke") {
      payload[prop] = { light: value, dark: value };
    } else {
      payload[prop] = value;
    }

    await editorRef.current?.updateObject(active, payload);
  }

  function renderNode(obj: AnyObject, depth: number) {
    if (!isNodeVisible(obj)) {
      return null;
    }

    const isGroup = obj.__class__ === "KritzelGroup";
    const expanded = isExpanded(obj.id);
    const isSelected = selectedObject?.id === obj.id;

    return (
      <div key={obj.id}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            padding: "4px 6px",
            paddingLeft: `${depth * 16 + 6}px`,
            borderRadius: "4px",
            marginBottom: "1px",
              background: isSelected ? "rgba(8, 126, 164, 0.08)" : "transparent",
              borderLeft: isSelected ? "3px solid #087ea4" : "3px solid transparent",
            opacity: obj.isVisible === false ? 0.6 : 1,
          }}
        >
          <span
            style={{
              width: "16px",
              textAlign: "center",
              fontSize: "10px",
              color: "#4d6a79",
              cursor: "pointer",
              userSelect: "none",
              flexShrink: 0,
            }}
            onClick={(event) => toggleExpand(event, obj)}
          >
            {isGroup ? (expanded ? "▼" : "▶") : "•"}
          </span>

          <div
            style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              gap: "6px",
              cursor: "pointer",
              minWidth: 0,
            }}
            onClick={() => void selectTreeObject(obj)}
          >
            <span
              style={{
                fontWeight: 500,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                flexShrink: 1,
              }}
            >
              {getDisplayName(obj)}
            </span>
            <span style={{ color: "#6e8794", fontSize: "10px", flexShrink: 0 }}>
              {obj.id.slice(0, 4)}
            </span>
          </div>

          <button
            style={{
              background: "transparent",
              border: "none",
              padding: "2px 4px",
              borderRadius: "3px",
              fontSize: "10px",
              color: "#6e8794",
              cursor: "pointer",
            }}
            onClick={(event) => void deleteTreeObject(event, obj)}
            title="Delete Object"
          >
            Delete
          </button>
        </div>

        {isGroup && expanded &&
          getGroupChildren(obj).map((child) => renderNode(child, depth + 1))}
      </div>
    );
  }

  return (
    <div style={hostStyle}>
      <div style={contentShellStyle}>
        <div style={editorContainerStyle}>
          <KritzelEditor
            ref={editorRef}
            editorId="object-explorer"
            theme="light"
            themes={[reactThemeLight]}
            syncConfig={syncConfig}
            isPanningEnabled={false}
            isZoomingEnabled={false}
            isMoreMenuVisible={false}
            isWorkspaceManagerVisible={false}
            onIsReady={() => {
              void onReady();
            }}
            onObjectsAdded={(event) =>
              onObjectsAdded(event as CustomEvent<ObjectsAddedEvent>)
            }
            onObjectsRemoved={(event) =>
              onObjectsRemoved(event as CustomEvent<ObjectsRemovedEvent>)
            }
            onObjectsUpdated={(event) =>
              onObjectsUpdated(event as CustomEvent<ObjectsUpdatedEvent>)
            }
            style={editorStyle}
          />
        </div>

        <aside style={asideStyle}>
          <div style={{ borderBottom: "1px solid #d8e8ee", paddingBottom: "10px" }}>
            <span style={taglineStyle}>Explorer Mode</span>
            <h2 style={{ margin: 0, color: "#087ea4", fontSize: "18px", lineHeight: 1.2 }}>
              Hierarchical Object Explorer
            </h2>
          </div>

          <section style={{ borderBottom: "1px solid #eee", paddingBottom: "10px" }}>
            <h4 style={sectionHeadingStyle}>Filters</h4>
            <input
              type="text"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search text, ID, or type..."
              style={searchInputStyle}
            />

            <div
              style={{
                fontSize: "11px",
                color: "#999999",
                margin: "6px 0 4px 0",
                textTransform: "uppercase",
                letterSpacing: "0.2px",
              }}
            >
              Types
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "4px", marginBottom: "4px" }}>
              {AVAILABLE_TYPES.map((type) => (
                <button
                  key={type}
                  style={filterChipStyle(selectedTypes.has(type))}
                  onClick={() => void toggleTypeFilter(type)}
                >
                  {type.replace("Kritzel", "")}
                </button>
              ))}
            </div>
          </section>

          <section style={{ borderBottom: "1px solid #eee", paddingBottom: "10px" }}>
            <h4 style={sectionHeadingStyle}>Canvas Hierarchy ({visibleRootsCount} roots)</h4>
            <div style={treeContainerStyle}>
              {rootObjects.length === 0 ? (
                <div style={{ padding: "12px", textAlign: "center", color: "#999999" }}>
                  No objects on canvas
                </div>
              ) : (
                rootObjects.map((root) => renderNode(root, 0))
              )}
            </div>
          </section>

          {selectedObject && (
            <section style={inspectorStyle}>
              <h4 style={sectionHeadingStyle}>
                Inspector: {selectedObject.__class__.replace("Kritzel", "")}
              </h4>

              <div style={inspectorFieldStyle}>
                <label style={inspectorLabelStyle}>ID</label>
                <input
                  type="text"
                  value={selectedObject.id}
                  disabled
                  style={{ ...inspectorInputStyle, background: "#eee", color: "#777" }}
                />
              </div>

              <div style={inspectorFieldStyle}>
                <label style={inspectorLabelStyle}>Position X / Y</label>
                <div style={{ display: "flex", gap: "4px" }}>
                  <input
                    type="number"
                    value={selectedObject.translateX}
                    onChange={(event) => void updateSelectedProperty("translateX", event)}
                    style={{ ...inspectorInputStyle, flex: 1, width: "50%" }}
                  />
                  <input
                    type="number"
                    value={selectedObject.translateY}
                    onChange={(event) => void updateSelectedProperty("translateY", event)}
                    style={{ ...inspectorInputStyle, flex: 1, width: "50%" }}
                  />
                </div>
              </div>

              {selectedObject.__class__ === "KritzelText" && (
                <div style={inspectorFieldStyle}>
                  <label style={inspectorLabelStyle}>Text Content</label>
                  <input
                    type="text"
                    value={(selectedObject.text as string) ?? ""}
                    onChange={(event) => void updateSelectedProperty("text", event)}
                    style={inspectorInputStyle}
                  />
                </div>
              )}

              {selectedObject.__class__ === "KritzelShape" && (
                <>
                  <div style={inspectorFieldStyle}>
                    <label style={inspectorLabelStyle}>Size W / H</label>
                    <div style={{ display: "flex", gap: "4px" }}>
                      <input
                        type="number"
                        value={selectedObject.width}
                        onChange={(event) => void updateSelectedProperty("width", event)}
                        style={{ ...inspectorInputStyle, flex: 1, width: "50%" }}
                      />
                      <input
                        type="number"
                        value={selectedObject.height}
                        onChange={(event) => void updateSelectedProperty("height", event)}
                        style={{ ...inspectorInputStyle, flex: 1, width: "50%" }}
                      />
                    </div>
                  </div>

                  <div style={inspectorFieldStyle}>
                    <label style={inspectorLabelStyle}>Fill Color</label>
                    <input
                      type="color"
                      value={resolveThemeColor(selectedObject.fillColor, "#ffffff")}
                      onChange={(event) => void updateSelectedProperty("fillColor", event)}
                      style={inspectorInputStyle}
                    />
                  </div>
                </>
              )}

              {selectedObject.__class__ === "KritzelPath" && (
                <>
                  <div style={inspectorFieldStyle}>
                    <label style={inspectorLabelStyle}>Fill Color</label>
                    <input
                      type="color"
                      value={resolveThemeColor(selectedObject.fill, "#000000")}
                      onChange={(event) => void updateSelectedProperty("fill", event)}
                      style={inspectorInputStyle}
                    />
                  </div>

                  <div style={inspectorFieldStyle}>
                    <label style={inspectorLabelStyle}>Stroke Color</label>
                    <input
                      type="color"
                      value={resolveThemeColor(selectedObject.stroke, "#000000")}
                      onChange={(event) => void updateSelectedProperty("stroke", event)}
                      style={inspectorInputStyle}
                    />
                  </div>
                </>
              )}

              <div style={inspectorFieldStyle}>
                <label style={inspectorLabelStyle}>
                  Opacity ({Math.round((selectedObject.opacity ?? 1) * 100)}%)
                </label>
                <input
                  type="range"
                  min="0.1"
                  max="1"
                  step="0.1"
                  value={selectedObject.opacity ?? 1}
                  onChange={(event) => void updateSelectedProperty("opacity", event)}
                  style={{ width: "100%", accentColor: "#087ea4", cursor: "pointer" }}
                />
              </div>
            </section>
          )}
        </aside>
      </div>
    </div>
  );
}
