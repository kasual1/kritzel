import { UpmadeEngineState } from "../interfaces/engine-state.interface";

export type StatePropertyKey = keyof UpmadeEngineState;
export type StateChangeListener<T = any> = (newValue: T, oldValue: T, propertyName: string) => void;