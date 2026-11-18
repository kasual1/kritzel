import { UpmadeFontRegistration } from '../interfaces/font.interface';

export const DEFAULT_TEXT_TOOL_AVAILABLE_FONTS: UpmadeFontRegistration[] = [
  'Arial',
  'Verdana',
  'Helvetica',
  'Tahoma',
  'Trebuchet MS',
  'Times New Roman',
  'Georgia',
  'Garamond',
  'Courier New',
  'Brush Script MT',
];

export const resolveTextToolAvailableFonts = (
  availableFonts?: UpmadeFontRegistration[],
): UpmadeFontRegistration[] => {
  if (!availableFonts || availableFonts.length === 0) {
    return [...DEFAULT_TEXT_TOOL_AVAILABLE_FONTS];
  }

  return [...availableFonts];
};