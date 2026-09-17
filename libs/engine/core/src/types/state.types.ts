import { KritzelEngineState } from "../interfaces/engine-state.interface";

export type StatePropertyKey = keyof KritzelEngineState;
export type StateChangeListener<T = any> = (newValue: T, oldValue: T, propertyName: string) => void;