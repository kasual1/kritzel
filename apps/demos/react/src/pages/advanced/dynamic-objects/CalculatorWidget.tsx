import { useEffect, useState, type CSSProperties } from "react";
import { createCalculatorInitialState, normalizeCalculatorState, type CalculatorOperator, type CalculatorState } from "./html-calculator";

type CalculatorWidgetProps = {
  initialState?: CalculatorState;
  onStateChange(state: CalculatorState): void;
};

const operatorLabels: Record<CalculatorOperator, string> = { add: "+", subtract: "-", multiply: "x", divide: "/" };

function runOperation(left: number, right: number, operator: CalculatorOperator): number {
  if (operator === "add") return left + right;
  if (operator === "subtract") return left - right;
  if (operator === "multiply") return left * right;
  return right === 0 ? 0 : left / right;
}

export function CalculatorWidget({ initialState, onStateChange }: CalculatorWidgetProps) {
  const [state, setState] = useState(() => normalizeCalculatorState(initialState));
  useEffect(() => onStateChange({ ...state }), [onStateChange, state]);

  const appendDigit = (digit: string) => setState((current) => ({ ...current, displayValue: current.shouldReplaceDisplay ? digit : current.displayValue === "0" ? digit : `${current.displayValue}${digit}`, shouldReplaceDisplay: false }));
  const chooseOperator = (operator: CalculatorOperator) => setState((current) => ({ ...current, storedValue: current.pendingOperator && current.storedValue !== null ? runOperation(current.storedValue, Number(current.displayValue), current.pendingOperator) : Number(current.displayValue), pendingOperator: operator, shouldReplaceDisplay: true }));
  const calculate = () => setState((current) => {
    if (current.storedValue === null || !current.pendingOperator) return current;
    const result = runOperation(current.storedValue, Number(current.displayValue), current.pendingOperator);
    return { ...current, displayValue: Number.isInteger(result) ? String(result) : result.toFixed(4).replace(/0+$/, "").replace(/\.$/, ""), storedValue: null, pendingOperator: null, shouldReplaceDisplay: true };
  });
  const appendDecimal = () => setState((current) => current.shouldReplaceDisplay ? { ...current, displayValue: "0.", shouldReplaceDisplay: false } : current.displayValue.includes(".") ? current : { ...current, displayValue: `${current.displayValue}.` });

  return (
    <section aria-label="React calculator" style={cardStyle}>
      <header style={headerStyle}><h3 style={{ margin: 0, fontSize: 16 }}>React Calculator</h3><strong style={{ color: "#087ea4" }}>{state.pendingOperator ? operatorLabels[state.pendingOperator] : ""}</strong></header>
      <output aria-live="polite" style={displayStyle}>{state.displayValue}</output>
      <div style={keypadStyle}>
        <button type="button" style={buttonStyle} onClick={() => setState(createCalculatorInitialState())}>C</button>
        <button type="button" style={operatorStyle} onClick={() => chooseOperator("divide")}>/</button>
        <button type="button" style={operatorStyle} onClick={() => chooseOperator("multiply")}>x</button>
        <button type="button" style={operatorStyle} onClick={() => chooseOperator("subtract")}>-</button>
        {["7", "8", "9"].map((digit) => <button key={digit} type="button" style={buttonStyle} onClick={() => appendDigit(digit)}>{digit}</button>)}
        <button type="button" style={operatorStyle} onClick={() => chooseOperator("add")}>+</button>
        {["4", "5", "6"].map((digit) => <button key={digit} type="button" style={buttonStyle} onClick={() => appendDigit(digit)}>{digit}</button>)}
        <button type="button" style={equalsStyle} onClick={calculate}>=</button>
        {["1", "2", "3"].map((digit) => <button key={digit} type="button" style={buttonStyle} onClick={() => appendDigit(digit)}>{digit}</button>)}
        <button type="button" style={{ ...buttonStyle, gridColumn: "span 2" }} onClick={() => appendDigit("0")}>0</button>
        <button type="button" style={buttonStyle} onClick={appendDecimal}>.</button>
      </div>
    </section>
  );
}

const cardStyle: CSSProperties = { display: "grid", gridTemplateRows: "auto 42px 1fr", gap: 8, height: "100%", padding: 14, border: "1px solid #e5e7eb", borderRadius: 12, boxShadow: "0 12px 32px rgba(32,33,36,.12)", boxSizing: "border-box", overflow: "hidden", background: "#fff", fontFamily: "Roboto, sans-serif" };
const headerStyle: CSSProperties = { display: "flex", alignItems: "center", justifyContent: "space-between" };
const displayStyle: CSSProperties = { display: "flex", alignItems: "center", justifyContent: "flex-end", padding: "0 12px", border: "1px solid #e0e0e0", borderRadius: 6, background: "#fafafa", fontSize: 24, fontWeight: 700, overflow: "hidden" };
const keypadStyle: CSSProperties = { display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gridTemplateRows: "repeat(5, minmax(0, 1fr))", gap: 6, minHeight: 0 };
const buttonStyle: CSSProperties = { minWidth: 0, minHeight: 0, border: "1px solid #dadce0", borderRadius: 6, background: "#fff", color: "#202124", cursor: "pointer", fontWeight: 600 };
const operatorStyle: CSSProperties = { ...buttonStyle, borderColor: "#087ea4", color: "#087ea4" };
const equalsStyle: CSSProperties = { ...operatorStyle, gridRow: "span 2", background: "#087ea4", color: "#fff" };