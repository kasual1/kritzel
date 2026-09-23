import { useEffect, useState } from "react";

export type CounterWidgetState = {
  count: number;
};

const DEFAULT_COUNTER_STATE: CounterWidgetState = { count: 0 };

export function createCounterWidgetInitialState(): CounterWidgetState {
  return { ...DEFAULT_COUNTER_STATE };
}

type CounterWidgetProps = {
  initialState?: CounterWidgetState;
  onStateChange?: (state: CounterWidgetState) => void;
};

export function CounterWidget({ initialState, onStateChange }: CounterWidgetProps) {
  const [count, setCount] = useState(initialState?.count ?? DEFAULT_COUNTER_STATE.count);

  useEffect(() => {
    onStateChange?.({ count });
  }, [count, onStateChange]);

  return (
    <section style={{ display: "flex", flexDirection: "column", gap: 10, padding: 14, boxSizing: "border-box", height: "100%", fontFamily: "sans-serif" }}>
      <h3 style={{ margin: 0, fontSize: 15 }}>React Counter</h3>
      <p style={{ margin: 0, fontSize: 12, color: "#555" }}>This is a real, running React component mounted into the custom-element object.</p>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: "auto" }}>
        <button type="button" onClick={() => setCount((value) => value - 1)} style={buttonStyle}>-</button>
        <span style={{ fontSize: 20, fontWeight: 700, minWidth: 24, textAlign: "center" }}>{count}</span>
        <button type="button" onClick={() => setCount((value) => value + 1)} style={buttonStyle}>+</button>
      </div>
    </section>
  );
}

const buttonStyle = {
  width: 32,
  height: 32,
  borderRadius: 6,
  border: "1px solid #61dafb",
  background: "#ffffff",
  color: "#0f172a",
  cursor: "pointer",
  fontSize: 16,
} as const;
