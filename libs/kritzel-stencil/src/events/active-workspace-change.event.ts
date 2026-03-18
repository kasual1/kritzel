export interface ActiveWorkspaceChangeEvent {
  id: string;
  name: string;
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
}
