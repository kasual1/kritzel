import { IKritzelUser } from './user.interface';

export interface KritzelRemoteCursorState {
  clientId: number;
  user: IKritzelUser;
  cursor: { x: number; y: number } | null;
  activeObjectId: string | null;
  selectionBox: { x: number; y: number; width: number; height: number } | null;
  lastUpdated: number;
  lastCursorMove: number;
}
