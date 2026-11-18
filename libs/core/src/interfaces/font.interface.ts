export interface UpmadeFontDefinition {
  family: string;
  label?: string;
  cssFontFamily?: string;
  source?: string;
}

export type UpmadeFontRegistration = string | UpmadeFontDefinition;

export interface UpmadeRegisteredFont {
  key: string;
  family: string;
  label: string;
  cssFontFamily: string;
  source?: string;
}

export type UpmadeFontMap = Record<string, UpmadeFontRegistration>;
