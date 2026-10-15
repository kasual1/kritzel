import { Component, Event, EventEmitter, h, Host, Prop, Watch } from '@stencil/core';
import { KritzelTermKey } from '@kritzel/engine';

@Component({
  tag: 'kritzel-chat-box',
  styleUrl: 'kritzel-chat-box.css',
  shadow: true,
})
export class KritzelChatBox {
  /** Current text value of the chat box. */
  @Prop({ mutable: true }) value: string = '';

  /** Placeholder text shown when the chat box is empty. Falls back to the localized term. */
  @Prop() placeholder?: string;

  /** Whether the chat box is disabled. */
  @Prop() disabled: boolean = false;

  /** Resolved localized strings keyed by term key, supplied by the editor. */
  @Prop() terms: Partial<Record<KritzelTermKey, string>> = {};

  /** Emitted with the current text when the user submits the chat box. */
  @Event() chatSubmit!: EventEmitter<string>;

  private textareaRef?: HTMLTextAreaElement;

  @Watch('value')
  onValueChange(newValue: string): void {
    if (this.textareaRef && this.textareaRef.value !== newValue) {
      this.textareaRef.value = newValue ?? '';
    }
  }

  private get canSubmit(): boolean {
    return !this.disabled && (this.value ?? '').trim().length > 0;
  }

  private get resolvedPlaceholder(): string {
    return this.placeholder ?? this.terms['chatBox.placeholder'] ?? 'Ask the AI...';
  }

  private handleInput = (event: Event): void => {
    this.value = (event.target as HTMLTextAreaElement).value;
  };

  private handleKeyDown = (event: KeyboardEvent): void => {
    if (event.key === 'Enter' && !event.shiftKey && !event.isComposing) {
      event.preventDefault();
      this.submit();
    }
  };

  private submit = (): void => {
    if (!this.canSubmit) {
      return;
    }

    this.chatSubmit.emit(this.value);
    this.value = '';
  };

  render() {
    const submitLabel = this.terms['chatBox.submit'] ?? 'Send';

    return (
      <Host>
        <div class="chat-box">
          <div class="chat-input-container">
            <textarea
              ref={el => (this.textareaRef = el)}
              class="chat-input"
              value={this.value}
              placeholder={this.resolvedPlaceholder}
              aria-label={this.resolvedPlaceholder}
              disabled={this.disabled}
              rows={2}
              onInput={this.handleInput}
              onKeyDown={this.handleKeyDown}
            ></textarea>
            <button class="chat-submit" type="button" aria-label={submitLabel} title={submitLabel} disabled={!this.canSubmit} onClick={this.submit}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path d="M12 19V5M6 11l6-6 6 6" />
              </svg>
            </button>
          </div>
        </div>
      </Host>
    );
  }
}
