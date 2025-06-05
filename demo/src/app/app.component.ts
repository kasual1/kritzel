import { ChangeDetectionStrategy, Component, HostListener } from '@angular/core';
import { KritzelEditor } from 'kritzel-angular';

@Component({
  selector: 'app-root',
  imports: [KritzelEditor],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent {
  title = 'kritzel.io';

  ngOnInit(): void {
    document.body.style.height = window.innerHeight + 'px';
  }

  @HostListener('window:resize')
  onResize(): void {
    document.body.style.height = window.innerHeight + 'px';
  }
}
