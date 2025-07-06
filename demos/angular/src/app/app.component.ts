import { AfterViewInit, Component, ViewChild } from '@angular/core';
import { KritzelEditor, KritzelText } from 'kritzel-angular';
@Component({
  selector: 'app-root',
  imports: [KritzelEditor],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
  standalone: true,
})
export class AppComponent implements AfterViewInit {
  @ViewChild(KritzelEditor)
  kritzelEditor!: KritzelEditor;

  async ngAfterViewInit(): Promise<void> {
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
    this.kritzelEditor.selectObjects([text]);
  }
}
