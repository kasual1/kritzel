import { LEGACY_CLIPBOARD_PAYLOAD_PREFIX } from '../../migrations/legacy-brand';

export const CLIPBOARD_PAYLOAD_PREFIX = 'updraw-clipboard/v1:';

/**
 * Returns the JSON part of a serialized clipboard payload, including payloads copied
 * before the rename (legacy prefix), or `null` when the text is not a clipboard payload.
 * @param text - The clipboard text
 */
export function getClipboardPayloadJson(text: string | null | undefined): string | null {
  if (!text) {
    return null;
  }
  for (const prefix of [CLIPBOARD_PAYLOAD_PREFIX, LEGACY_CLIPBOARD_PAYLOAD_PREFIX]) {
    if (text.startsWith(prefix)) {
      return text.slice(prefix.length);
    }
  }
  return null;
}

export interface SerializedClipboardObject {
  [key: string]: any;
  __class__?: string;
  __children__?: SerializedClipboardObject[];
}

export interface UpdrawClipboardPayload {
  version: 1;
  sourceWorkspaceId?: string;
  objects: SerializedClipboardObject[];
}

export type PasteIntent =
  | { type: 'updraw_objects'; payload: UpdrawClipboardPayload }
  | { type: 'image_files'; files: File[] }
  | { type: 'plain_text'; text: string }
  | { type: 'unknown' };
