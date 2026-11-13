import { ChangeDetectionStrategy, Component } from '@angular/core';
import { UpdrawEditor } from '@updraw/angular-editor';

@Component({
  selector: 'updraw-canvas',
  standalone: true,
  imports: [UpdrawEditor],
  templateUrl: './updraw-canvas.component.html',
  styleUrls: ['./updraw-canvas.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UpdrawCanvasComponent {
  readonly editorId = 'updraw-canvas';
  isReady = false;

  onReady(): void {
    this.isReady = true;
  }
}
