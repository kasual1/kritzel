import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  HostListener,
  inject,
  input,
  output,
  viewChild,
} from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';

/** Shows a UI fullscreen, outside the canvas. */
@Component({
  selector: 'app-ui-preview',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    role: 'dialog',
    'aria-modal': 'true',
    '[attr.aria-label]': '"Preview of " + title()',
  },
  template: `
    <div class="ui-preview__bar">
      <span>{{ title() }}</span>
      <button #close type="button" class="ui-preview__close" (click)="closed.emit()">Close <kbd>Esc</kbd></button>
    </div>
    <iframe class="ui-preview__frame" [title]="title()" [srcdoc]="trustedDocument()" sandbox="allow-scripts"></iframe>
  `,
  styles: [`
    :host {
      position: fixed;
      inset: 0;
      z-index: 1000;
      display: flex;
      flex-direction: column;
      background: #ffffff;
      animation: ui-preview-in 180ms ease-out;
    }

    @keyframes ui-preview-in {
      from { opacity: 0; transform: scale(0.98); }
    }

    .ui-preview__bar {
      display: flex;
      align-items: center;
      gap: 12px;
      height: 44px;
      padding: 0 8px 0 16px;
      border-bottom: 1px solid #e4e4e7;
      font-size: 14px;
      font-weight: 500;
      color: #3f3f46;
    }

    .ui-preview__close {
      margin-left: auto;
      height: 30px;
      padding: 0 12px;
      border: 0;
      border-radius: 8px;
      background: #f4f4f5;
      font: inherit;
      color: inherit;
      cursor: pointer;
    }

    .ui-preview__frame {
      flex: 1;
      width: 100%;
      border: 0;
    }
  `],
})
export class UiPreviewComponent {
  private readonly sanitizer = inject(DomSanitizer);
  private readonly closeButton = viewChild.required<ElementRef<HTMLButtonElement>>('close');

  readonly title = input.required<string>();
  readonly document = input.required<string>();
  readonly closed = output<void>();

  // Angular would strip the scripts that make the UI work. The sandbox runs them in an opaque origin, away from this page.
  readonly trustedDocument = computed(() => this.sanitizer.bypassSecurityTrustHtml(this.document()));

  constructor() {
    afterNextRender(() => this.closeButton().nativeElement.focus());
  }

  @HostListener('window:keydown.escape')
  onEscape() {
    this.closed.emit();
  }
}
