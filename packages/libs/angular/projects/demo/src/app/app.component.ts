import { Component } from '@angular/core';
import { LibModule } from 'lib';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [LibModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'demo';

  list = ['Ananas', 'Banane', 'Apfel'];
}
