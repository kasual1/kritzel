import { Component } from '@angular/core';
import {
  DEFAULT_BRUSH_CONFIG,
  KritzelBrushTool,
  KritzelEditor,
  KritzelSelectionTool,
  KritzelText,
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

  controls = [
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

    const text = new KritzelText({
      value: 'Hello Kritzel!',
      translateX: 0,
      translateY: 0,
      fontSize: 24,
      fontFamily: 'Arial',
      fontColor: '#000000',
      height: 200,
      width: 200,
    });

    this.kritzelEditor.addObject(text);
    this.kritzelEditor.centerObjectInViewport(text);
    this.kritzelEditor.selectObjects([text]);
  }
}
