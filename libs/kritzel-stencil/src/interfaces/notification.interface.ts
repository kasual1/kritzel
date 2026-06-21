export interface KritzelNotification {
  /** Unique identifier for the notification */
  id: string;
  /** Type of the notification (e.g., 'info', 'warning', 'error') */
  type: 'info' | 'warning' | 'error';
  /** Message content of the notification */
  message: string;
  /** Optional timestamp for when the notification was created */
  timestamp?: Date;
}
