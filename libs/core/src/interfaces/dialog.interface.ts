export type UpdrawDialogCloseReason = 'backdrop' | 'escape' | 'close-button' | 'programmatic';

export interface IUpdrawDialogCloseEvent {
  reason: UpdrawDialogCloseReason;
}
