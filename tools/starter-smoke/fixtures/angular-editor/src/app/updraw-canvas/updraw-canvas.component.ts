import { ChangeDetectionStrategy, Component } from '@angular/core';
import { KritzelEditor } from '@kritzel/angular-editor';

@Component({
  selector: 'kritzel-canvas',
  standalone: true,
  imports: [KritzelEditor],
  templateUrl: './kritzel-canvas.component.html',
  styleUrls: ['./kritzel-canvas.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KritzelCanvasComponent {
  readonly editorId = 'kritzel-canvas';
  isReady = false;

  onReady(): void {
    this.isReady = true;
  }
}
