export type CalculatorOperator = "+" | "-" | "*" | "/";

export type CalculatorState = {
  display: string;
  stored: number | null;
  operator: CalculatorOperator | null;
  replace: boolean;
};

export type CalculatorAction =
  | { type: "digit"; digit: string }
  | { type: "decimal" }
  | { type: "operator"; operator: CalculatorOperator }
  | { type: "equals" }
  | { type: "clear" };

export const INITIAL_CALCULATOR_STATE: CalculatorState = {
  display: "0",
  stored: null,
  operator: null,
  replace: false,
};

function calculate(left: number, right: number, operator: CalculatorOperator): number {
  switch (operator) {
    case "+": return left + right;
    case "-": return left - right;
    case "*": return left * right;
    case "/": return left / right;
  }
}

function resultState(result: number): CalculatorState {
  return {
    display: Number.isFinite(result) ? String(Number(result.toPrecision(12))) : "Error",
    stored: null,
    operator: null,
    replace: true,
  };
}

export function calculatorReducer(state: CalculatorState, action: CalculatorAction): CalculatorState {
  switch (action.type) {
    case "clear":
      return { ...INITIAL_CALCULATOR_STATE };
    case "digit":
      return {
        ...state,
        display: state.replace || state.display === "0" ? action.digit : state.display + action.digit,
        replace: false,
      };
    case "decimal":
      if (!state.replace && state.display.includes(".")) return state;
      return { ...state, display: state.replace ? "0." : state.display + ".", replace: false };
    case "operator": {
      if (state.display === "Error") return state;
      const stored = state.operator && state.stored !== null && !state.replace
        ? calculate(state.stored, Number(state.display), state.operator)
        : state.stored !== null && state.replace ? state.stored : Number(state.display);
      if (!Number.isFinite(stored)) return resultState(stored);
      return { ...resultState(stored), stored, operator: action.operator };
    }
    case "equals":
      if (state.stored === null || state.operator === null || state.display === "Error") return state;
      return resultState(calculate(state.stored, Number(state.display), state.operator));
  }
}
