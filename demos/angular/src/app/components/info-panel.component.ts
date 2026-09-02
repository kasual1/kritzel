import {
  ChangeDetectionStrategy,
  Component,
  input,
  signal,
  ViewEncapsulation,
} from '@angular/core';
import { LucideMenu } from '@lucide/angular';

let nextInfoPanelId = 0;

@Component({
  selector: 'app-info-panel',
  standalone: true,
  imports: [LucideMenu],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    '[class.has-toolbar-toggle]': 'hasToolbarToggle()',
    '(pointerdown)': 'stopPointerEvent($event)',
    '(pointermove)': 'stopPointerEvent($event)',
    '(pointerup)': 'stopPointerEvent($event)',
    '(pointercancel)': 'stopPointerEvent($event)',
  },
  template: `
    <button
      class="info-panel-toggle"
      type="button"
      [attr.aria-controls]="panelId"
      [attr.aria-expanded]="isOpen()"
      aria-label="Toggle info panel"
      (click)="toggle()"
    >
      <svg lucideMenu [size]="18" [strokeWidth]="2.25"></svg>
    </button>
    <section class="info-panel-body" [id]="panelId" aria-label="Demo information">
      <ng-content></ng-content>
    </section>
  `,
  styles: [
    `
      app-info-panel {
        display: block;
        flex: 0 0 var(--demo-info-panel-width, 200px);
        width: var(--demo-info-panel-width, 200px);
        min-height: 0;
        background: #fff;
        border-left: 1px solid #ebebeb;
        font-size: 13px;
      }

      .info-panel-toggle {
        display: none;
      }

      .info-panel-body {
        box-sizing: border-box;
        height: 100%;
        overflow-y: auto;
        padding: 8px;
      }

      app-info-panel h3 {
        margin: 0 0 8px;
        font-size: 14px;
      }

      @media (max-width: 720px) {
        app-info-panel {
          position: absolute;
          top: 8px;
          right: 8px;
          z-index: 5;
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          width: min(240px, calc(100% - 16px));
          min-height: auto;
          background: transparent;
          border-left: 0;
          pointer-events: none;
        }

        .info-panel-toggle {
          display: inline-flex;
          width: 36px;
          height: 36px;
          align-items: center;
          justify-content: center;
          border: 1px solid #ccc;
          border-radius: 4px;
          background: #fff;
          box-shadow: 0 2px 8px rgb(0 0 0 / 12%);
          cursor: pointer;
          pointer-events: auto;
        }

        app-info-panel.has-toolbar-toggle > .info-panel-toggle {
          display: none;
        }

        .info-panel-body {
          display: none;
          width: 100%;
          max-height: min(320px, calc(100vh - 96px));
          margin-top: 8px;
          border: 1px solid #ebebeb;
          border-radius: 4px;
          background: #fff;
          box-shadow: 0 8px 24px rgb(0 0 0 / 16%);
          pointer-events: auto;
        }

        .info-panel-toggle[aria-expanded='true'] + .info-panel-body {
          display: block;
        }
      }
    `,
  ],
})
export class InfoPanelComponent {
  readonly hasToolbarToggle = input(false);
  readonly panelId = `demo-info-panel-${nextInfoPanelId++}`;
  readonly isOpen = signal(false);

  toggle() {
    this.isOpen.update((isOpen) => !isOpen);
  }

  stopPointerEvent(event: PointerEvent) {
    event.stopPropagation();
  }
}

@Component({
  selector: 'app-info-panel-toggle',
  imports: [LucideMenu],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button
      class="info-panel-toolbar-toggle"
      type="button"
      [attr.aria-controls]="panel().panelId"
      [attr.aria-expanded]="panel().isOpen()"
      aria-label="Toggle info panel"
      (click)="panel().toggle()"
    >
      <svg lucideMenu [size]="17" [strokeWidth]="2.25"></svg>
    </button>
  `,
  styles: [
    `
      :host {
        display: none;
        margin-left: auto;
      }

      .info-panel-toolbar-toggle {
        display: inline-flex;
        width: 29px;
        height: 29px;
        box-sizing: border-box;
        align-items: center;
        justify-content: center;
        padding: 0;
        border: 1px solid #ccc;
        border-radius: 4px;
        background: #fff;
        color: #333;
        cursor: pointer;
      }

      .info-panel-toolbar-toggle:hover,
      .info-panel-toolbar-toggle:focus-visible {
        border-color: #dd0031;
        background: #dd0031;
        color: #fff;
        outline: 0;
      }

      .info-panel-toolbar-toggle:focus-visible {
        box-shadow: 0 0 0 2px rgb(221 0 49 / 25%);
      }

      @media (max-width: 720px) {
        :host {
          display: inline-flex;
        }
      }
    `,
  ],
})
export class InfoPanelToggleComponent {
  readonly panel = input.required<InfoPanelComponent>();
}