import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

import { UpdrawEditor } from '@updraw/angular-editor';
import { angularThemeLight } from '../const/angular-theme-light';
import { angularThemeDark } from '../const/angular-theme-dark';

@Component({
  selector: 'app-wrapped-editor-page',
  imports: [UpdrawEditor],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      id="e2e-editor-wrapper"
      [style.width.px]="wrapperWidth"
      [style.height.px]="wrapperHeight"
      style="box-sizing: border-box; border: 4px solid #ff0080; background: #fafafa; position: relative; overflow: hidden; margin: 24px;"
    >
      <updraw-editor
        style="width: 100%; height: 100%;"
        [theme]="'light'"
        [themes]="themes"
      ></updraw-editor>
    </div>
  `,
})
export class WrappedEditorPageComponent implements OnInit {
  themes = [angularThemeLight, angularThemeDark];
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
