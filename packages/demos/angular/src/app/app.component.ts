import { AfterViewInit, Component, HostListener } from '@angular/core';
import { KritzelEditor } from 'kritzel-angular';

@Component({
  selector: 'app-root',
  imports: [KritzelEditor],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
  standalone: true,
})
export class AppComponent implements AfterViewInit{
 title = 'angular';

  ngAfterViewInit(): void {
    document.body.style.height = 300 + 'px';
  }

  @HostListener('window:resize')
  onResize(): void {
    document.body.style.height = 300 + 'px';
  }

}
