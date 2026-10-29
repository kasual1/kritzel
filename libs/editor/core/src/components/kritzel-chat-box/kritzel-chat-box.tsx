import { Component, Element, Event, EventEmitter, h, Host, Listen, Prop, State, Watch } from '@stencil/core';
import { KritzelTermKey } from '@kritzel/core';

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
   * automatically while focused once the text no longer fits on one line,
   * collapsing again when focus is lost.
   */
  @Prop({ mutable: true, reflect: true }) mode: KritzelChatBoxMode = 'collapsed';

  /** Placeholder text shown when the chat box is empty. Falls back to the localized term. */
  @Prop() placeholder?: string;

  /** Whether the chat box is disabled. */
  @Prop() disabled: boolean = false;

  /** Whether to show a circulating progress indicator around the chat box border. */
  @Prop() loading: boolean = false;

  /** Resolved localized strings keyed by term key, supplied by the editor. */
  @Prop() terms: Partial<Record<KritzelTermKey, string>> = {};

  /** Emitted with the current text when the user submits the chat box. */
  @Event() chatSubmit!: EventEmitter<string>;

  /** Emitted when the user stops the current response. */
  @Event() chatStop!: EventEmitter<void>;

  /** Emitted when the mode changes, including automatic expansion. */
  @Event() modeChange!: EventEmitter<KritzelChatBoxMode>;

  private textareaRef?: HTMLTextAreaElement;

  private caretRef?: HTMLDivElement;

  private caretMirror?: HTMLDivElement;

  private caretFrame?: number;

  private resizeObserver?: ResizeObserver;

  private shouldRevealCaret = false;

  @Element() host!: HTMLKritzelChatBoxElement;

  @State() isFocused = false;

  @State() isScrollable = false;

  /** True while the box is expanded only because the text overflowed the collapsed row. */
  private isAutoExpanded = false;

  /** Ctrl+I toggles chat focus, unless another editable element owns the keystroke. */
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
    if (event.repeat) {
      return;
    }

    const textarea = this.textareaRef;
    if (textarea && this.host.shadowRoot?.activeElement === textarea) {
      textarea.blur();
      this.mode = 'collapsed';
      textarea.scrollTop = 0;
      textarea.scrollLeft = 0;
    } else {
      textarea?.focus();
    }
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
    if (typeof ResizeObserver !== 'undefined') {
      this.resizeObserver = new ResizeObserver(() => {
        this.expandIfOverflowing();
        this.scheduleCaretUpdate();
      });
      this.resizeObserver.observe(this.host);
    }
  }

  disconnectedCallback(): void {
    document.removeEventListener('selectionchange', this.scheduleCaretUpdate);
    this.resizeObserver?.disconnect();
    if (this.caretFrame !== undefined) {
      cancelAnimationFrame(this.caretFrame);
      this.caretFrame = undefined;
    }
    this.caretMirror?.remove();
  }

  private scheduleCaretUpdate = (): void => {
    if (this.caretFrame !== undefined) {
      return;
    }
    this.caretFrame = requestAnimationFrame(() => {
      this.caretFrame = undefined;
      this.updateInputHeight();
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
      this.shouldRevealCaret = false;
      caret.classList.remove('visible');
      return;
    }

    const mirror = this.getTextMirror(textarea);
    const marker = document.createElement('span');
    marker.textContent = '\u200b';
    mirror.textContent = textarea.value.slice(0, textarea.selectionStart);
    mirror.appendChild(marker);

    if (this.mode === 'expanded' && !this.isScrollable) {
      // Growing content fits the final height; scrolling against the animated height makes it jump.
      textarea.scrollTop = 0;
      this.shouldRevealCaret = false;
    } else if (this.shouldRevealCaret) {
      this.shouldRevealCaret = false;
      const style = getComputedStyle(textarea);
      const caretTop = marker.offsetTop - textarea.scrollTop;
      const visibleTop = parseFloat(style.paddingTop);
      const visibleBottom = textarea.clientHeight - parseFloat(style.paddingBottom);
      if (caretTop + marker.offsetHeight > visibleBottom) {
        textarea.scrollTop += caretTop + marker.offsetHeight - visibleBottom;
      } else if (caretTop < visibleTop) {
        textarea.scrollTop -= visibleTop - caretTop;
      }
    }

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

  private getTextMirror(textarea: HTMLTextAreaElement): HTMLDivElement {
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

    return mirror;
  }

  private updateInputHeight(): void {
    const textarea = this.textareaRef;
    if (!textarea || this.mode === 'collapsed') {
      this.isScrollable = false;
      return;
    }

    const style = getComputedStyle(textarea);
    const maxHeight = Math.ceil(5 * parseFloat(style.lineHeight) + parseFloat(style.paddingTop) + parseFloat(style.paddingBottom));
    const mirror = this.getTextMirror(textarea);
    // Include the empty row after a trailing newline, just like the native textarea.
    mirror.textContent = `${textarea.value}\u200b`;
    const contentHeight = mirror.scrollHeight;
    textarea.style.setProperty('--chat-input-height', `${Math.min(contentHeight, maxHeight)}px`);
    this.isScrollable = contentHeight > maxHeight;
  }

  private expandIfOverflowing(): void {
    const textarea = this.textareaRef;
    if (this.mode !== 'collapsed' || !textarea || this.host.shadowRoot?.activeElement !== textarea) {
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
    this.shouldRevealCaret = true;
    this.value = (event.target as HTMLTextAreaElement).value;
    this.expandIfOverflowing();
    this.scheduleCaretUpdate();
  };

  private handleFocus = (): void => {
    this.shouldRevealCaret = true;
    const wasCollapsed = this.mode === 'collapsed';
    this.isFocused = true;
    this.expandIfOverflowing();
    if (wasCollapsed) {
      this.moveCaretToEnd();
    }
    this.scheduleCaretUpdate();
  };

  /** Focusing a collapsed box resumes typing at the end instead of where the user clicked. */
  private handlePointerDown = (event: PointerEvent): void => {
    if (this.isFocused || this.mode !== 'collapsed' || event.button !== 0 || !this.textareaRef) {
      return;
    }
    event.preventDefault();
    this.textareaRef.focus();
  };

  private moveCaretToEnd(): void {
    const textarea = this.textareaRef;
    if (!textarea) {
      return;
    }
    const end = textarea.value.length;
    textarea.setSelectionRange(end, end);
    // Re-apply after layout settles: the box may have just expanded, and touch taps place the caret after focus.
    requestAnimationFrame(() => {
      if (this.host.shadowRoot?.activeElement === textarea) {
        const latestEnd = textarea.value.length;
        textarea.setSelectionRange(latestEnd, latestEnd);
        this.shouldRevealCaret = true;
        this.scheduleCaretUpdate();
      }
    });
  }

  private handleBlur = (): void => {
    this.isFocused = false;
    if (this.isAutoExpanded) {
      this.isAutoExpanded = false;
      this.mode = 'collapsed';
      if (this.textareaRef) {
        this.textareaRef.scrollTop = 0;
        this.textareaRef.scrollLeft = 0;
      }
    }
    this.scheduleCaretUpdate();
  };

  private handleKeyDown = (event: KeyboardEvent): void => {
    this.shouldRevealCaret = true;
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

  private handleSelect = (): void => {
    this.shouldRevealCaret = true;
    this.scheduleCaretUpdate();
  };

  private submit = (): void => {
    if (!this.canSubmit) {
      return;
    }

    this.chatSubmit.emit(this.value);
    this.value = '';
  };

  private handleButtonClick = (): void => {
    if (this.loading) {
      this.chatStop.emit();
      return;
    }

    this.submit();
  };

  render() {
    const submitLabel = this.terms['chatBox.submit'] ?? 'Send';
    const buttonLabel = this.loading ? this.terms['chatBox.stop'] ?? 'Stop' : submitLabel;
    // A collapsed, unfocused box previews only the first line, since textareas cannot truncate explicit line breaks.
    const lines = (this.value ?? '').split('\n');
    const showPreview = this.mode === 'collapsed' && !this.isFocused && lines.length > 1;

    return (
      <Host>
        <div class="chat-box" aria-busy={this.loading ? 'true' : 'false'}>
          {this.loading && (
            <svg class="chat-progress" aria-hidden="true">
              <rect class="chat-progress-ring" x="1" y="1" pathLength="100" />
            </svg>
          )}
          <div class={{ 'chat-input-container': true, collapsed: this.mode === 'collapsed', 'has-preview': showPreview }}>
            <textarea
              ref={el => (this.textareaRef = el)}
              class={{ 'chat-input': true, scrollable: this.isScrollable }}
              value={this.value}
              placeholder={this.resolvedPlaceholder}
              aria-label={this.resolvedPlaceholder}
              disabled={this.disabled}
              rows={this.mode === 'collapsed' ? 1 : 2}
              onInput={this.handleInput}
              onKeyDown={this.handleKeyDown}
              onFocus={this.handleFocus}
              onBlur={this.handleBlur}
              onScroll={this.scheduleCaretUpdate}
              onSelect={this.handleSelect}
              onPointerDown={this.handlePointerDown}
              onPointerUp={this.scheduleCaretUpdate}
              onTransitionEnd={this.scheduleCaretUpdate}
            ></textarea>
            {showPreview && (
              <div class="chat-preview" aria-hidden="true">
                {lines[0]}…
              </div>
            )}
            <div class="chat-caret" ref={el => (this.caretRef = el)} aria-hidden="true"></div>
            <button
              class="chat-submit"
              type="button"
              aria-label={buttonLabel}
              disabled={this.disabled || (!this.loading && !this.canSubmit)}
              onClick={this.handleButtonClick}
            >
              <kritzel-icon name={this.loading ? 'square' : 'arrowUp'} size={16} aria-hidden="true"></kritzel-icon>
            </button>
          </div>
        </div>
      </Host>
    );
  }
}
