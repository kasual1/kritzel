import { ChangeDetectionStrategy, Component, input, output, signal } from '@angular/core';
import { MOCK_UIS, type MockUi } from './mock-uis';

/** Stands in for the editor's chat box while requests are mocked: the prompts are prefilled and cannot be edited. */
@Component({
  selector: 'app-mock-chat-box',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <textarea class="mock-chat__prompt" rows="3" readonly aria-label="Mocked prompt" [value]="uis[index()].prompt"></textarea>
    <div class="mock-chat__controls">
      <button type="button" class="mock-chat__nav" aria-label="Previous prompt" [disabled]="index() === 0" (click)="index.set(index() - 1)">‹</button>
      <span>{{ index() + 1 }} of {{ uis.length }}</span>
      <button type="button" class="mock-chat__nav" aria-label="Next prompt" [disabled]="index() === uis.length - 1" (click)="index.set(index() + 1)">›</button>
      <button type="button" class="mock-chat__send" [disabled]="isWorking()" (click)="sendPrompt()">Send</button>
    </div>
  `,
  styles: [`
    :host {
      position: absolute;
      left: 50%;
      bottom: 18px;
      z-index: 20;
      display: block;
      box-sizing: border-box;
      width: min(480px, calc(100% - 32px));
      padding: 6px;
      border: 1px solid #e4e4e7;
      border-radius: 20px;
      background: #ffffff;
      box-shadow: 0 4px 8px rgba(20, 18, 31, 0.04), 0 18px 36px -14px rgba(20, 18, 31, 0.2);
      transform: translateX(-50%);
    }

    .mock-chat__prompt {
      display: block;
      box-sizing: border-box;
      width: 100%;
      height: 88px;
      padding: 12px 14px 44px;
      border: 0;
      border-radius: 14px;
      outline: 0;
      resize: none;
      background: #f3f4f6;
      font: inherit;
      font-size: 15px;
      line-height: 1.4;
      color: #0a0a0a;
      cursor: default;
    }

    .mock-chat__controls {
      position: absolute;
      right: 16px;
      bottom: 16px;
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 12px;
      font-weight: 600;
      color: #52525b;
      user-select: none;
    }

    .mock-chat__nav {
      width: 26px;
      height: 26px;
      padding: 0;
      border: 0;
      border-radius: 50%;
      background: #ffffff;
      font: inherit;
      font-size: 18px;
      line-height: 1;
      color: #18181b;
      cursor: pointer;
    }

    .mock-chat__nav:hover:not(:disabled) {
      background: #e4e4e7;
    }

    .mock-chat__nav:disabled {
      opacity: 0.45;
      cursor: default;
    }

    .mock-chat__send {
      height: 30px;
      margin-left: 4px;
      padding: 0 14px;
      border: 0;
      border-radius: 15px;
      background: var(--gen-ui-accent);
      font: inherit;
      font-size: 13px;
      color: #ffffff;
      cursor: pointer;
    }

    .mock-chat__send:hover:not(:disabled) {
      background: var(--gen-ui-accent-hover);
    }

    .mock-chat__send:disabled {
      opacity: 0.5;
      cursor: default;
    }
  `],
})
export class MockChatBoxComponent {
  readonly isWorking = input.required<boolean>();
  readonly send = output<MockUi>();

  readonly uis = MOCK_UIS;
  readonly index = signal(0);

  sendPrompt() {
    this.send.emit(this.uis[this.index()]);
    this.index.set(Math.min(this.index() + 1, this.uis.length - 1));
  }
}
