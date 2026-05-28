import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

import { KritzelEditor } from 'kritzel-angular';
import { customAngularTheme } from '../const/custom-angular-theme';

@Component({
  selector: 'app-wrapped-editor-page',
  imports: [KritzelEditor],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      id="e2e-editor-wrapper"
      [style.width.px]="wrapperWidth"
      [style.height.px]="wrapperHeight"
      style="box-sizing: border-box; border: 4px solid #ff0080; background: #fafafa; position: relative; overflow: hidden; margin: 24px;"
    >
      <kritzel-editor
        style="width: 100%; height: 100%;"
        [theme]="'angular-theme'"
        [themes]="themes"
      ></kritzel-editor>
    </div>
  `,
})
export class WrappedEditorPageComponent implements OnInit {
  themes = [customAngularTheme];
  wrapperWidth = 320;
  wrapperHeight = 600;

  constructor(private route: ActivatedRoute) {}

  ngOnInit() {
    const params = this.route.snapshot.queryParams;
    if (params['width']) {
      this.wrapperWidth = parseInt(params['width'], 10);
    }
    if (params['height']) {
      this.wrapperHeight = parseInt(params['height'], 10);
    }
  }
}
