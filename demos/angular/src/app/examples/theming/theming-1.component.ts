import { Component, ChangeDetectionStrategy, ViewChild, ElementRef } from '@angular/core';
import { KritzelEditor } from 'kritzel-angular';
import { KritzelTheme, lightTheme, ThemeHelper } from 'kritzel-stencil';

const brandedAccentTheme: KritzelTheme = {
  ...lightTheme,
  controls: {
    ...lightTheme.controls,
    controlSelectedBackgroundColor: '#6200EE',
    controlSelectedColor: '#ffffff',
  },
  selection: {
    ...lightTheme.selection,
    borderColor: '#6200EE',
    handleColor: '#ffffff',
  },
};

@Component({
  selector: 'app-theming-1',
  imports: [KritzelEditor],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<kritzel-editor #editorEl (isReady)="onIsReady()"></kritzel-editor>`,
  styles: [`
    :host {
      display: block;
      height: 100%;
    }
  `],
})
export class Theming1Component {
  @ViewChild('editorEl', { read: ElementRef }) editorEl!: ElementRef<HTMLElement>;

  onIsReady(): void {
    ThemeHelper.applyThemeToElement(this.editorEl.nativeElement, brandedAccentTheme);
  }
}
