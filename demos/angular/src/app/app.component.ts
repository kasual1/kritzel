import { Component } from '@angular/core';
import { KritzelEditor, KritzelImage } from 'kritzel-angular';

@Component({
  selector: 'app-root',
  imports: [KritzelEditor],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
  standalone: true,
})
export class AppComponent {
  kritzelEditor!: HTMLKritzelEditorElement;

  async onIsReady(event: any): Promise<void> {
    this.kritzelEditor = event.detail;

    const img = new Image();
    img.src = 'https://placehold.co/600x400';

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

    const workspace = await this.kritzelEditor.getActiveWorkspace();

    
    workspace?.addObject(image);

    this.kritzelEditor.centerObjectInViewport(image);
    this.kritzelEditor.selectAllObjectsInViewport();
  }
}
