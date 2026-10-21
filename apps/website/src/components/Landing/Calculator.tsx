import { useReducer, type Dispatch } from "react";
import {
  calculatorReducer,
  INITIAL_CALCULATOR_STATE,
  type CalculatorAction,
  type CalculatorOperator,
  type CalculatorState,
} from "./calculator-state";
import styles from "./styles.module.css";

const OPERATORS: ReadonlyArray<{ value: CalculatorOperator; label: string; name: string }> = [
  { value: "/", label: "/", name: "Divide" },
  { value: "*", label: "x", name: "Multiply" },
  { value: "-", label: "-", name: "Subtract" },
  { value: "+", label: "+", name: "Add" },
];

type CalculatorProps = {
  /** Pass both to control the calculator from outside, e.g. to mirror its state elsewhere. */
  state?: CalculatorState;
  dispatch?: Dispatch<CalculatorAction>;
};

export default function Calculator(props: CalculatorProps) {
  const [ownState, ownDispatch] = useReducer(calculatorReducer, INITIAL_CALCULATOR_STATE);
  const state = props.state ?? ownState;
  const dispatch = props.dispatch ?? ownDispatch;
  const digit = (value: string) => (
    <button key={value} type="button" onClick={() => dispatch({ type: "digit", digit: value })}>
      {value}
    </button>
  );
  const operator = (index: number) => {
    const { value, label, name } = OPERATORS[index];
    return (
      <button
        type="button"
        className={styles.calculatorOperator}
        aria-label={name}
        onClick={() => dispatch({ type: "operator", operator: value })}
      >
        {label}
      </button>
    );
  };

  return (
    <section className={styles.calculator} aria-label="Calculator">
      <header className={styles.calculatorHeader}>
        <span>Calculator</span>
        <span>{state.operator === "*" ? "x" : state.operator}</span>
      </header>
      <output className={styles.calculatorDisplay} aria-label="Result" aria-live="polite">
        {state.display}
      </output>
      <div className={styles.calculatorKeypad}>
        <button type="button" aria-label="Clear" onClick={() => dispatch({ type: "clear" })}>C</button>
        {operator(0)}
        {operator(1)}
        {operator(2)}
        {["7", "8", "9"].map(digit)}
        {operator(3)}
        {["4", "5", "6"].map(digit)}
        <button
          type="button"
          className={styles.calculatorEquals}
          aria-label="Equals"
          onClick={() => dispatch({ type: "equals" })}
        >
          =
        </button>
        {["1", "2", "3"].map(digit)}
        <button
          type="button"
          className={styles.calculatorZero}
          onClick={() => dispatch({ type: "digit", digit: "0" })}
        >
          0
        </button>
        <button type="button" aria-label="Decimal point" onClick={() => dispatch({ type: "decimal" })}>.</button>
      </div>
    </section>
  );
}
