import { IUpdrawUser } from './user.interface';

export interface UpdrawRemoteCursorState {
  clientId: number;
  user: IUpdrawUser;
  cursor: { x: number; y: number } | null;
  activeObjectId: string | null;
  selectionBox: { x: number; y: number; width: number; height: number } | null;
  lastUpdated: number;
  lastCursorMove: number;
}
