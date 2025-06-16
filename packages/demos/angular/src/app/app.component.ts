import { Component, HostListener, OnInit, ViewChild } from '@angular/core';
import { KritzelEditor } from 'kritzel-angular';
@Component({
  selector: 'app-root',
  imports: [KritzelEditor],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
  standalone: true,
})
export class AppComponent implements OnInit{
  @ViewChild('editor')
  editor!: HTMLElement;

  ngOnInit(): void {
    document.body.style.height = window.innerHeight + 'px';
    const editor = document.getElementById('editor');

    if(editor){
      editor.style.height = window.innerHeight + 'px';
      editor.style.width = window.innerWidth + 'px';
    }
  }

  @HostListener('window:resize')
  onResize(): void {
    document.body.style.height = window.innerHeight + 'px';
    const editor = document.getElementById('editor');

    if(editor){
      editor.style.height = window.innerHeight + 'px';
      editor.style.width = window.innerWidth + 'px';
    }
  }
}
