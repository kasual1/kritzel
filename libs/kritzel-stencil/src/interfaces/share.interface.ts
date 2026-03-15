/**
 * Event payload emitted when the public sharing state changes.
 */
export interface IKritzelIsPublicChangedEvent {
  /** ID of the workspace whose sharing state changed */
  workspaceId: string;
  /** Whether the workspace is now publicly accessible */
  isPublic: boolean;
}

