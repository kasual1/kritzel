export const CLIPBOARD_PAYLOAD_PREFIX = 'kritzel-clipboard/v1:';

export interface SerializedClipboardObject {
  [key: string]: any;
  __class__?: string;
  __children__?: SerializedClipboardObject[];
}

export interface KritzelClipboardPayload {
  version: 1;
  sourceWorkspaceId?: string;
  objects: SerializedClipboardObject[];
}

export type PasteIntent =
  | { type: 'kritzel_objects'; payload: KritzelClipboardPayload }
  | { type: 'image_files'; files: File[] }
  | { type: 'plain_text'; text: string }
  | { type: 'unknown' };
