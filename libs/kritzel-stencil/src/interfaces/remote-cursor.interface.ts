import { IKritzelUser } from './user.interface';

export interface KritzelRemoteCursorState {
  clientId: number;
  user: IKritzelUser;
  cursor: { x: number; y: number } | null;
  activeObjectId: string | null;
  lastUpdated: number;
}
