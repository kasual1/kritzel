import { Component, Host, h, State, Event, EventEmitter, Method, Element, Prop } from '@stencil/core';
import { KritzelLoginProvider } from '@kritzel/engine';
import { LoginEvent } from '@kritzel/engine';

/**
 * Login dialog component for displaying authentication provider buttons.
 * This is a presentational component that emits events for all actions.
 * The parent component (kritzel-editor) handles the actual authentication flow.
 */
@Component({
  tag: 'kritzel-login-dialog',
  styleUrl: 'kritzel-login-dialog.css',
  shadow: true,
})
export class KritzelLoginDialog {
  @Element() host!: HTMLElement;

  /** Array of authentication provider buttons to render */
  @Prop() providers: KritzelLoginProvider[] = [];

  /** Dialog title */
  @Prop() dialogTitle: string = 'Sign in';

  /** Optional subtitle text displayed below the title */
  @Prop() subtitle?: string;

  @State() isDialogOpen: boolean = false;
  @State() loadingProvider: string | null = null;

  /** Emitted when a provider button is clicked */
  @Event() providerLogin: EventEmitter<LoginEvent>;

  /** Emitted when the dialog is closed */
  @Event() dialogClosed: EventEmitter<void>;

  /** Opens the login dialog */
  @Method()
  async open(): Promise<void> {
    this.loadingProvider = null;
    this.isDialogOpen = true;
  }

  /** Closes the login dialog */
  @Method()
  async close(): Promise<void> {
    this.isDialogOpen = false;
    this.loadingProvider = null;
  }

  /** Sets or clears the loading state on a provider button */
  @Method()
  async setLoading(provider: string | null): Promise<void> {
    this.loadingProvider = provider;
  }

  private handleProviderClick = (provider: KritzelLoginProvider): void => {
    if (this.loadingProvider) return;
    this.loadingProvider = provider.name;
    this.providerLogin.emit({ provider: provider.name });
  };

  private closeDialog = (): void => {
    this.isDialogOpen = false;
    this.loadingProvider = null;
    this.dialogClosed.emit();
  };

  render() {
    return (
      <Host>
        <kritzel-dialog
          dialogTitle={this.dialogTitle}
          isOpen={this.isDialogOpen}
          onDialogClose={this.closeDialog}
          size="small"
          contained={true}
        >
          <div class="login-content">
            {this.subtitle && (
              <p class="login-subtitle">{this.subtitle}</p>
            )}

            <div class="login-providers">
              {this.providers.map(provider => (
                <button
                  key={provider.name}
                  class={{
                    'provider-button': true,
                    'is-loading': this.loadingProvider === provider.name,
                    'is-disabled': this.loadingProvider !== null && this.loadingProvider !== provider.name,
                  }}
                  disabled={this.loadingProvider !== null && this.loadingProvider !== provider.name}
                  onClick={() => this.handleProviderClick(provider)}
                >
                  {this.loadingProvider === provider.name ? (
                    <span class="spinner"></span>
                  ) : (
                    provider.icon && <kritzel-icon name={provider.icon} size={20} />
                  )}
                  <span class="provider-label">{provider.label}</span>
                </button>
              ))}
            </div>
          </div>
        </kritzel-dialog>
      </Host>
    );
  }
}
