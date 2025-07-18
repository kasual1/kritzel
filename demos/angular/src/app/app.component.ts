import { Component } from '@angular/core';
import {
  DEFAULT_BRUSH_CONFIG,
  KritzelBrushTool,
  KritzelEditor,
  KritzelPath,
  KritzelSelectionTool,
  KritzelToolbarControl,
} from 'kritzel-angular';

@Component({
  selector: 'app-root',
  imports: [KritzelEditor],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
  standalone: true,
})
export class AppComponent {
  kritzelEditor!: HTMLKritzelEditorElement;

  controls: KritzelToolbarControl[] = [
    {
      name: 'selection',
      type: 'tool',
      tool: KritzelSelectionTool,
      icon: 'cursor',
    },
    {
      name: 'brush',
      type: 'tool',
      tool: KritzelBrushTool,
      isDefault: true,
      icon: 'pen',
      config: DEFAULT_BRUSH_CONFIG,
    },
    {
      name: 'divider',
      type: 'divider',
    },
    {
      name: 'config',
      type: 'config',
    },
  ];

  async onIsReady(event: any): Promise<void> {
    this.kritzelEditor = event.detail;

    const path = new KritzelPath({
      points: [[0, 0], [100, 100]],
      translateX: 0,
      translateY: 0
    });

    this.kritzelEditor.addObject(path);
    this.kritzelEditor.centerObjectInViewport(path);
    this.kritzelEditor.selectAllObjectsInViewport();
  }
}
