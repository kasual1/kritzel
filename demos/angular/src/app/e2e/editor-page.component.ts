import { ChangeDetectionStrategy, Component } from '@angular/core';

import { KritzelEditor } from 'kritzel-angular';

@Component({
  selector: 'app-editor-page',
  imports: [KritzelEditor],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: ` <kritzel-editor></kritzel-editor> `,
})
export class EditorPageComponent {}
