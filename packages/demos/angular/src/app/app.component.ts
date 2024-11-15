import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LibModule } from '@kritzel/angular/dist/lib';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, LibModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'angular';
}
