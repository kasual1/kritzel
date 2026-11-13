export interface UpdrawFontDefinition {
  family: string;
  label?: string;
  cssFontFamily?: string;
  source?: string;
}

export type UpdrawFontRegistration = string | UpdrawFontDefinition;

export interface UpdrawRegisteredFont {
  key: string;
  family: string;
  label: string;
  cssFontFamily: string;
  source?: string;
}

export type UpdrawFontMap = Record<string, UpdrawFontRegistration>;
