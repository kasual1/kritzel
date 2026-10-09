import { describe, expect, test } from "vitest";
import { calculatorReducer, INITIAL_CALCULATOR_STATE, type CalculatorAction } from "./calculator-state";

function run(...actions: CalculatorAction[]) {
  return actions.reduce(calculatorReducer, INITIAL_CALCULATOR_STATE);
}

describe("hero calculator", () => {
  test.each([
    ["+", "11"],
    ["-", "5"],
    ["*", "24"],
    ["/", "2.66666666667"],
  ] as const)("calculates %s", (operator, expected) => {
    expect(run(
      { type: "digit", digit: "8" },
      { type: "operator", operator },
      { type: "digit", digit: "3" },
      { type: "equals" },
    ).display).toBe(expected);
  });

  test("chains operations and replaces the pending operator", () => {
    expect(run(
      { type: "digit", digit: "2" },
      { type: "operator", operator: "+" },
      { type: "digit", digit: "3" },
      { type: "operator", operator: "*" },
      { type: "operator", operator: "-" },
      { type: "digit", digit: "4" },
      { type: "equals" },
    ).display).toBe("1");
  });

  test("accepts one decimal point and rounds floating-point results", () => {
    expect(run(
      { type: "decimal" },
      { type: "decimal" },
      { type: "digit", digit: "1" },
      { type: "operator", operator: "+" },
      { type: "decimal" },
      { type: "digit", digit: "2" },
      { type: "equals" },
    ).display).toBe("0.3");
  });

  test("shows division by zero as an error and allows a new calculation", () => {
    const error = run(
      { type: "digit", digit: "8" },
      { type: "operator", operator: "/" },
      { type: "digit", digit: "0" },
      { type: "equals" },
    );
    expect(error.display).toBe("Error");
    expect(calculatorReducer(error, { type: "digit", digit: "4" }).display).toBe("4");
    expect(calculatorReducer(error, { type: "clear" })).toEqual(INITIAL_CALCULATOR_STATE);
  });

  test("starts fresh after equals and clears all pending state", () => {
    const result = run(
      { type: "digit", digit: "9" },
      { type: "operator", operator: "*" },
      { type: "digit", digit: "2" },
      { type: "equals" },
    );
    expect(calculatorReducer(result, { type: "digit", digit: "7" }).display).toBe("7");
    expect(calculatorReducer(result, { type: "clear" })).toEqual(INITIAL_CALCULATOR_STATE);
  });
});
