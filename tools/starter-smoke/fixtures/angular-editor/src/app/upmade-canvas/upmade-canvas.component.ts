import { ChangeDetectionStrategy, Component } from '@angular/core';
import { UpmadeEditor } from '@upmade/angular-editor';

@Component({
  selector: 'upmade-canvas',
  standalone: true,
  imports: [UpmadeEditor],
  templateUrl: './upmade-canvas.component.html',
  styleUrls: ['./upmade-canvas.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UpmadeCanvasComponent {
  readonly editorId = 'upmade-canvas';
  isReady = false;

  onReady(): void {
    this.isReady = true;
  }
}
