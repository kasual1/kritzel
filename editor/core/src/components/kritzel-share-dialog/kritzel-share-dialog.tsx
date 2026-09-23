import { Component, Host, h, State, Event, EventEmitter, Method, Element, Prop, Watch } from '@stencil/core';
import { KritzelTermKey } from '@kritzel/engine';
import QRCode from 'qrcode';

/**
 * Share dialog component for managing workspace link sharing.
 * This is a presentational component that emits events for all actions.
 * The parent component (kritzel-editor) handles the business logic.
 */
@Component({
  tag: 'kritzel-share-dialog',
  styleUrl: 'kritzel-share-dialog.css',
  shadow: true,
})
export class KritzelShareDialog {
  @Element() host!: HTMLElement;

  /**
   * Whether the workspace is currently public.
   */
  @Prop() isPublic: boolean = false;

  /**
   * The ID of the workspace being shared. Used to build the share URL.
   */
  @Prop() workspaceId: string | undefined = undefined;

  /** Resolved localized strings keyed by term key, supplied by the editor. */
  @Prop() terms: Partial<Record<KritzelTermKey, string>> = {};

  @Watch('isPublic')
  onIsPublicChange(newValue: boolean) {
    this.internalIsPublic = newValue;
    void this.updateQrCodeDataUrl();
  }

  @Watch('workspaceId')
  onWorkspaceIdChange() {
    void this.updateQrCodeDataUrl();
  }

  @State() isDialogOpen: boolean = false;
  @State() internalIsPublic: boolean = false;
  @State() copySuccess: boolean = false;
  @State() qrCodeDataUrl: string = '';

  private qrCodeUpdateSequence: number = 0;

  /**
   * Emitted when the user toggles the public sharing state.
   */
  @Event() toggleIsPublic!: EventEmitter<boolean>;

  /**
   * Emitted when the dialog is closed.
   */
  @Event() dialogClosed!: EventEmitter<void>;

  /**
   * Opens the share dialog.
   */
  @Method()
  async open(): Promise<void> {
    this.internalIsPublic = this.isPublic;
    this.isDialogOpen = true;
    await this.updateQrCodeDataUrl();
  }

  /**
   * Closes the share dialog.
   */
  @Method()
  async close(): Promise<void> {
    this.isDialogOpen = false;
  }

  private handleToggleChange = (event: CustomEvent<boolean>): void => {
    const enabled = event.detail;

    // Update local state optimistically for immediate UI feedback
    this.internalIsPublic = enabled;
    void this.updateQrCodeDataUrl();

    this.toggleIsPublic.emit(enabled);
  };

  private async updateQrCodeDataUrl(): Promise<void> {
    if (!this.internalIsPublic) {
      this.qrCodeDataUrl = '';
      return;
    }

    const shareUrl = this.getShareUrl();
    if (!shareUrl) {
      this.qrCodeDataUrl = '';
      return;
    }

    const sequence = ++this.qrCodeUpdateSequence;

    try {
      const dataUrl = await QRCode.toDataURL(shareUrl, {
        margin: 1,
        width: 180,
      });

      if (sequence !== this.qrCodeUpdateSequence) {
        return;
      }

      this.qrCodeDataUrl = dataUrl;
    } catch {
      if (sequence !== this.qrCodeUpdateSequence) {
        return;
      }

      this.qrCodeDataUrl = '';
    }
  }

  private getShareUrl(): string {
    if (!this.workspaceId) return '';

    const url = new URL(this.workspaceId, window.location.origin);
    url.searchParams.set('share', 'true');
    return url.toString();
  }

  private handleCopyUrl = async (): Promise<void> => {
    const shareUrl = this.getShareUrl();
    if (!shareUrl) return;

    try {
      await navigator.clipboard.writeText(shareUrl);
      this.copySuccess = true;
      setTimeout(() => {
        this.copySuccess = false;
      }, 2000);
    } catch {
      // Clipboard API failed, fallback to legacy method
      const textArea = document.createElement('textarea');
      textArea.value = shareUrl;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      this.copySuccess = true;
      setTimeout(() => {
        this.copySuccess = false;
      }, 2000);
    }
  };

  private closeDialog = (): void => {
    this.isDialogOpen = false;
    this.dialogClosed.emit();
  };

  render() {
    return (
      <Host>
        <kritzel-dialog
          dialogTitle={this.terms['share.dialogTitle'] ?? 'Share Workspace'}
          size="small"
          isOpen={this.isDialogOpen}
          onDialogClose={this.closeDialog}
          contained={true}
        >
          <div class="share-content">
            {/* Link Sharing Toggle */}
            <div class="share-section">
              <div class="share-row">
                <div class="share-label-group">
                  <label class="share-label">{this.terms['share.linkSharing.label'] ?? 'Link sharing'}</label>
                  <p class="share-description">
                    {this.internalIsPublic
                      ? (this.terms['share.linkSharing.enabledDescription'] ?? 'Anyone with the link can access this workspace.')
                      : (this.terms['share.linkSharing.disabledDescription'] ?? 'Link sharing is disabled. Only you can access this workspace.')}
                  </p>
                </div>
                <kritzel-slide-toggle
                  checked={this.internalIsPublic}
                  onCheckedChange={this.handleToggleChange}
                  label={this.terms['share.linkSharing.toggleLabel'] ?? 'Enable link sharing'}
                />
              </div>
            </div>

            {/* Share URL Section - only shown when enabled */}
            {this.internalIsPublic && (
              <div class="share-section">
                <div class="share-url-container">
                  <input
                    type="text"
                    class="share-url-input"
                    value={this.getShareUrl()}
                    readOnly
                    onClick={(e) => (e.target as HTMLInputElement).select()}
                  />
                  <button
                    class={{ 'copy-button': true, 'copy-success': this.copySuccess }}
                    onClick={this.handleCopyUrl}
                    title={this.copySuccess ? (this.terms['share.copyLink.copied'] ?? 'Copied!') : (this.terms['share.copyLink.title'] ?? 'Copy link')}
                  >
                    <kritzel-icon
                      name={this.copySuccess ? 'check' : 'copy'}
                      size={18}
                    />
                  </button>
                </div>
                {this.qrCodeDataUrl && (
                  <div class="share-qr-container">
                    <img
                      class="share-qr-image"
                      src={this.qrCodeDataUrl}
                      alt="QR code for share link"
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        </kritzel-dialog>
      </Host>
    );
  }
}
