import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
} from '@angular/core';

@Component({
  selector: 'app-toolbar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  template: `<ng-content></ng-content>`,
  styles: [
    `
      app-toolbar {
        display: flex;
        position: relative;
        align-items: center;
        gap: 8px;
        padding: 8px 12px;
        background: #f5f5f5;
        border-bottom: 1px solid #ebebeb;
        flex-wrap: wrap;
      }

      app-toolbar:has(> app-info-panel-toggle) {
        padding-right: 52px;
      }

      app-toolbar > app-info-panel-toggle {
        position: absolute;
        top: 8px;
        right: 12px;
      }

      app-toolbar > button {
        padding: 6px 12px;
        border: 1px solid #ccc;
        border-radius: 4px;
        background: #fff;
        cursor: pointer;
        font-size: 13px;
      }

      app-toolbar > button:hover:not(:disabled) {
        background: #dd0031;
        color: #fff;
        border-color: #dd0031;
      }
    `,
  ],
})
export class ToolbarComponent {}