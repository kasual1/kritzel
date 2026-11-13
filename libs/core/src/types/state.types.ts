import { UpdrawEngineState } from "../interfaces/engine-state.interface";

export type StatePropertyKey = keyof UpdrawEngineState;
export type StateChangeListener<T = any> = (newValue: T, oldValue: T, propertyName: string) => void;