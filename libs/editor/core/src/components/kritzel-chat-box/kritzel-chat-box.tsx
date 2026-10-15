import { Component, Element, Event, EventEmitter, h, Host, Listen, Prop, Watch } from '@stencil/core';
import { KritzelTermKey } from '@kritzel/engine';

export type KritzelChatBoxMode = 'collapsed' | 'expanded';

@Component({
  tag: 'kritzel-chat-box',
  styleUrl: 'kritzel-chat-box.css',
  shadow: true,
})
export class KritzelChatBox {
  /** Current text value of the chat box. */
  @Prop({ mutable: true }) value: string = '';

  /**
   * Display mode. `collapsed` shows a single row and switches to `expanded`
   * automatically once the text no longer fits on one line.
   */
  @Prop({ mutable: true, reflect: true }) mode: KritzelChatBoxMode = 'collapsed';

  /** Placeholder text shown when the chat box is empty. Falls back to the localized term. */
  @Prop() placeholder?: string;

  /** Whether the chat box is disabled. */
  @Prop() disabled: boolean = false;

  /** Resolved localized strings keyed by term key, supplied by the editor. */
  @Prop() terms: Partial<Record<KritzelTermKey, string>> = {};

  /** Emitted with the current text when the user submits the chat box. */
  @Event() chatSubmit!: EventEmitter<string>;

  /** Emitted when the mode changes, including automatic expansion. */
  @Event() modeChange!: EventEmitter<KritzelChatBoxMode>;

  private textareaRef?: HTMLTextAreaElement;

  private caretRef?: HTMLDivElement;

  private caretMirror?: HTMLDivElement;

  private caretFrame?: number;

  @Element() host!: HTMLKritzelChatBoxElement;

  /** True while the box is expanded only because the text overflowed the collapsed row. */
  private isAutoExpanded = false;

  /** Ctrl+I focuses the chat box from anywhere, unless another editable element owns the keystroke. */
  @Listen('keydown', { target: 'window' })
  handleWindowKeyDown(event: KeyboardEvent): void {
    if (this.disabled || event.isComposing || !event.ctrlKey || event.shiftKey || event.altKey || event.metaKey || event.key.toLowerCase() !== 'i') {
      return;
    }

    const path = event.composedPath();
    if (!path.includes(this.host)) {
      const isInsideDialog = path.some(el => el instanceof HTMLElement && (el.tagName === 'DIALOG' || el.tagName === 'KRITZEL-DIALOG' || el.getAttribute('role') === 'dialog'));
      const target = path[0];
      const isEditableTarget = target instanceof HTMLElement && (target.isContentEditable || target.matches('input, textarea, select'));
      if (isInsideDialog || isEditableTarget) {
        return;
      }
    }

    event.preventDefault();
    this.textareaRef?.focus();
  }

  /**
   * The canvas prevents default on pointer events, so clicking it does not move focus.
   * Blur the textarea explicitly on any pointerdown outside the chat box.
   */
  @Listen('pointerdown', { target: 'document', capture: true })
  handleDocumentPointerDown(event: PointerEvent): void {
    const textarea = this.textareaRef;
    if (!textarea || !this.host.shadowRoot?.activeElement) {
      return;
    }

    if (!event.composedPath().includes(this.host)) {
      textarea.blur();
    }
  }

  @Watch('value')
  onValueChange(newValue: string): void {
    if (this.textareaRef && this.textareaRef.value !== newValue) {
      this.textareaRef.value = newValue ?? '';
    }

    if (this.isAutoExpanded && !newValue) {
      this.isAutoExpanded = false;
      this.mode = 'collapsed';
    }
  }

  @Watch('mode')
  onModeChange(newMode: KritzelChatBoxMode, oldMode: KritzelChatBoxMode): void {
    if (newMode !== oldMode) {
      this.modeChange.emit(newMode);
    }
  }

  componentDidRender(): void {
    this.expandIfOverflowing();
    this.scheduleCaretUpdate();
  }

  connectedCallback(): void {
    document.addEventListener('selectionchange', this.scheduleCaretUpdate);
  }

  disconnectedCallback(): void {
    document.removeEventListener('selectionchange', this.scheduleCaretUpdate);
    if (this.caretFrame !== undefined) {
      cancelAnimationFrame(this.caretFrame);
    }
    this.caretMirror?.remove();
  }

  private scheduleCaretUpdate = (): void => {
    if (this.caretFrame !== undefined) {
      return;
    }
    this.caretFrame = requestAnimationFrame(() => {
      this.caretFrame = undefined;
      this.updateCaret();
    });
  };

  /**
   * Native carets cannot be widened via CSS, so the native caret is hidden and a custom
   * caret is positioned by measuring the text before the selection in a hidden mirror element.
   */
  private updateCaret(): void {
    const textarea = this.textareaRef;
    const caret = this.caretRef;
    if (!textarea || !caret) {
      return;
    }

    const isFocused = this.host.shadowRoot?.activeElement === textarea;
    if (!isFocused || this.disabled || textarea.selectionStart !== textarea.selectionEnd) {
      caret.classList.remove('visible');
      return;
    }

    const style = getComputedStyle(textarea);
    const mirror = this.caretMirror ?? (this.caretMirror = document.createElement('div'));
    if (!mirror.isConnected) {
      textarea.parentElement?.appendChild(mirror);
    }

    const paddingLeft = parseFloat(style.paddingLeft);
    const paddingRight = parseFloat(style.paddingRight);
    Object.assign(mirror.style, {
      position: 'absolute',
      visibility: 'hidden',
      top: '0',
      left: '0',
      boxSizing: 'content-box',
      width: `${textarea.clientWidth - paddingLeft - paddingRight}px`,
      padding: style.padding,
      border: '0',
      font: style.font,
      letterSpacing: style.letterSpacing,
      lineHeight: style.lineHeight,
      whiteSpace: 'pre-wrap',
      overflowWrap: 'break-word',
      wordBreak: style.wordBreak,
      height: '0',
      overflow: 'hidden',
      pointerEvents: 'none',
    });

    const marker = document.createElement('span');
    marker.textContent = '\u200b';
    mirror.textContent = textarea.value.slice(0, textarea.selectionStart);
    mirror.appendChild(marker);

    const top = textarea.offsetTop + marker.offsetTop - textarea.scrollTop;
    const left = textarea.offsetLeft + marker.offsetLeft - textarea.scrollLeft;

    caret.style.height = `${marker.offsetHeight}px`;
    caret.style.transform = `translate(${left}px, ${top}px)`;
    caret.classList.add('visible');

    // Restart the blink so the caret stays solid while the user types or moves it.
    caret.style.animation = 'none';
    void caret.offsetWidth;
    caret.style.animation = '';
  }

  private expandIfOverflowing(): void {
    const textarea = this.textareaRef;
    if (this.mode !== 'collapsed' || !textarea) {
      return;
    }

    if (textarea.scrollHeight > textarea.clientHeight + 1) {
      this.isAutoExpanded = true;
      this.mode = 'expanded';
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
    this.expandIfOverflowing();
  };

  private handleKeyDown = (event: KeyboardEvent): void => {
    this.scheduleCaretUpdate();

    if (event.key === 'Escape' && !event.isComposing) {
      event.preventDefault();
      event.stopPropagation();
      this.textareaRef?.blur();
      return;
    }

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
          <div class={{ 'chat-input-container': true, collapsed: this.mode === 'collapsed' }}>
            <textarea
              ref={el => (this.textareaRef = el)}
              class="chat-input"
              value={this.value}
              placeholder={this.resolvedPlaceholder}
              aria-label={this.resolvedPlaceholder}
              disabled={this.disabled}
              rows={this.mode === 'collapsed' ? 1 : 2}
              onInput={this.handleInput}
              onKeyDown={this.handleKeyDown}
              onFocus={this.scheduleCaretUpdate}
              onBlur={this.scheduleCaretUpdate}
              onScroll={this.scheduleCaretUpdate}
              onSelect={this.scheduleCaretUpdate}
              onPointerUp={this.scheduleCaretUpdate}
            ></textarea>
            <div class="chat-caret" ref={el => (this.caretRef = el)} aria-hidden="true"></div>
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
