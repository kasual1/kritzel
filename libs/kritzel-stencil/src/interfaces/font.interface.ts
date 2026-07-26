export interface KritzelFontDefinition {
  family: string;
  label?: string;
  cssFontFamily?: string;
  source?: string;
}

export type KritzelFontRegistration = string | KritzelFontDefinition;

export interface KritzelRegisteredFont {
  key: string;
  family: string;
  label: string;
  cssFontFamily: string;
  source?: string;
}

export type KritzelFontMap = Record<string, KritzelFontRegistration>;
