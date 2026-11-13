export const CLIPBOARD_PAYLOAD_PREFIX = 'updraw-clipboard/v1:';

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
