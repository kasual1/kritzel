import { Component } from '@angular/core';
import {
  DEFAULT_BRUSH_CONFIG,
  KritzelBrushTool,
  KritzelEditor,
  KritzelImage,
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

    const img = new Image();
    img.src = "https://placehold.co/600x400";

    await new Promise<void>((resolve) => {
      img.onload = () => resolve();
    });

    const image = new KritzelImage({
      src: img.src,
      x: 0,
      y: 0,
      translateX: 0,
      translateY: 0,
    });

    const { scaledWidth, scaledHeight } = image.calculateScaledDimensions(img);
    image.width = scaledWidth;
    image.height = scaledHeight;

    this.kritzelEditor.addObject(image);
    this.kritzelEditor.centerObjectInViewport(image);
    this.kritzelEditor.selectAllObjectsInViewport();
  }
}
