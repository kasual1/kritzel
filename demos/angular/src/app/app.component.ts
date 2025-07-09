import { Component } from '@angular/core';
import { KritzelEditor, KritzelText } from 'kritzel-angular';

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

    await this.kritzelEditor.addObject(text);
    await this.kritzelEditor.centerObjectInViewport(text);
    await this.kritzelEditor.selectObjects([text]);
  }
}
