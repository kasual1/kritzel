import { Component } from '@angular/core'; // Removed HostListener
import { KritzelEditor } from 'kritzel-angular';

@Component({
  selector: 'app-root',
  imports: [KritzelEditor],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
  standalone: true,
})
export class AppComponent {
  title = 'kritzel.io';
}
