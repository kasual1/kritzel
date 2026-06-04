import { ChangeDetectionStrategy, Component, signal, computed, ViewChild, ElementRef } from '@angular/core';
import { 
  KritzelEditor, 
  EditorIsReadyEvent, 
  KritzelSyncConfig, 
  KritzelShape, 
  KritzelText, 
  ShapeType 
} from 'kritzel-angular';
import { angularThemeLight } from '../../const/angular-theme-light';
import { angularThemeDark } from '../../const/angular-theme-dark';

interface Slide {
  title: string;
  centerX: number;
  centerY: number;
}

@Component({
  selector: 'app-slideshow-presentation',
  imports: [KritzelEditor],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header class="presentation-header">
      <div class="brand">
        <span class="badge">Presentation Mode</span>
        <h1 class="title">Interactive Slideshow</h1>
      </div>
      
      <div class="controls-group">
        <div class="nav-buttons">
          <button 
            [disabled]="currentSlideIndex() === 0" 
            (click)="goToPrevSlide()"
            class="nav-btn"
          >
            Previous
          </button>
          <span class="slide-indicator">
            Slide <strong>{{ currentSlideIndex() + 1 }}</strong> of {{ slides.length }}
          </span>
          <button 
            [disabled]="currentSlideIndex() === slides.length - 1" 
            (click)="goToNextSlide()"
            class="nav-btn"
          >
            Next
          </button>
        </div>
      </div>
    </header>

    <div class="editor-container">
      <kritzel-editor
        editorId="slideshow-presentation"
        [theme]="'angular-theme'"
        [themes]="themes"
        [wheelEnabled]="false"
        [isMoreMenuVisible]="false"
        [isWorkspaceManagerVisible]="false"
        (isReady)="onReady()"
      ></kritzel-editor>
    </div>
  `,
  styles: `
    :host {
      display: flex;
      flex-direction: column;
      height: 100%;
      font-family: Roboto, sans-serif;
      background-color: #fafafa;
    }

    .presentation-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 24px;
      background: #ffffff;
      border-bottom: 1px solid #ebebeb;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
    }

    .brand {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .badge {
      align-self: flex-start;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      background-color: rgba(221, 0, 48, 0.1);
      color: #dd0031;
      padding: 2px 8px;
      border-radius: 99px;
      letter-spacing: 0.5px;
    }

    .title {
      margin: 0;
      font-size: 20px;
      font-weight: 600;
      color: #333333;
    }

    .controls-group {
      display: flex;
      align-items: center;
      gap: 24px;
    }

    .nav-buttons {
      display: flex;
      align-items: center;
      gap: 12px;
      background: #f0f0f0;
      padding: 4px;
      border-radius: 8px;
    }

    .nav-btn {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 6px 16px;
      border: none;
      border-radius: 6px;
      background: #ffffff;
      cursor: pointer;
      font-size: 13px;
      font-weight: 500;
      color: #333333;
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
      transition: all 0.2s ease;
    }

    .nav-btn:hover:not(:disabled) {
      background: #dd0031;
      color: #ffffff;
    }

    .nav-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
      box-shadow: none;
    }

    .slide-indicator {
      font-size: 13px;
      color: #555555;
      min-width: 90px;
      text-align: center;
    }

    .editor-container {
      flex: 1;
      position: relative;
    }

    kritzel-editor {
      display: block;
      width: 100%;
      height: 100%;
    }
  `,
})
export class SlideshowPresentationComponent {
  @ViewChild(KritzelEditor) editor!: KritzelEditor;

  themes = [angularThemeLight, angularThemeDark];

  

  slides: Slide[] = [
    { title: '1. Welcome to Kritzel', centerX: 0, centerY: 0 },
    { title: '2. Core Frontend Capabilities', centerX: 1200, centerY: 0 },
    { title: '3. Seamless Presentation Layout', centerX: 2400, centerY: 0 },
  ];

  currentSlideIndex = signal<number>(0);

  async onReady() {
    const existing = await this.editor.getAllObjects();
    if (existing.length === 0) {
      await this.seedSlides();
    }
    // Navigate to the initial slide coordinates
    await this.navigateToSlide(0);
  }

  async seedSlides() {
    // Slide 1 Background Frame and Content
    await this.editor.addObject(
      new KritzelShape({
        translateX: -400,
        translateY: -225,
        width: 800,
        height: 450,
        shapeType: ShapeType.Rectangle,
        fillColor: { light: '#ffffff', dark: '#1b1b1e' },
        strokeColor: { light: '#dd0031', dark: '#b30027' },
        strokeWidth: 4,
      })
    );

    await this.editor.addObject(
      new KritzelText({
        text: 'Welcome to Kritzel',
        translateX: -350,
        translateY: -150,
        fontSize: 36,
        fontColor: { light: '#dd0031', dark: '#ff4d6d' },
      })
    );

    await this.editor.addObject(
      new KritzelText({
        text: 'A modern vector drawing component for web builders. This workspace demonstrates Slideshow Mode, spacing slide sheets on a virtual horizontal track.\n\nUse the presentation controls above to glide smoothly between slides!',
        translateX: -350,
        translateY: -50,
        fontSize: 20,
        fontColor: { light: '#333333', dark: '#eeeeee' },
      })
    );

    // Decorative shape Slide 1
    await this.editor.addObject(
      new KritzelShape({
        translateX: 200,
        translateY: 50,
        width: 120,
        height: 120,
        shapeType: ShapeType.Ellipse,
        fillColor: { light: '#e3f2fd', dark: '#1a237e' },
        strokeColor: { light: '#1565c0', dark: '#90caf9' },
        strokeWidth: 2,
      })
    );

    // Slide 2 Background Frame and Content
    await this.editor.addObject(
      new KritzelShape({
        translateX: 800,
        translateY: -225,
        width: 800,
        height: 450,
        shapeType: ShapeType.Rectangle,
        fillColor: { light: '#ffffff', dark: '#1b1b1e' },
        strokeColor: { light: '#dd0031', dark: '#b30027' },
        strokeWidth: 4,
      })
    );

    await this.editor.addObject(
      new KritzelText({
        text: 'Core Frontend Power',
        translateX: 850,
        translateY: -150,
        fontSize: 36,
        fontColor: { light: '#dd0031', dark: '#ff4d6d' },
      })
    );

    await this.editor.addObject(
      new KritzelText({
        text: '• Offline-First Canvas Persistence\n• Dynamic Viewport & Navigation Helpers\n• Tailored Custom Color Tool Palettes\n• Entirely Interactive Drawing Tools',
        translateX: 850,
        translateY: -50,
        fontSize: 20,
        fontColor: { light: '#333333', dark: '#eeeeee' },
      })
    );

    // Decorative shape Slide 2
    await this.editor.addObject(
      new KritzelShape({
        translateX: 1400,
        translateY: 50,
        width: 120,
        height: 100,
        shapeType: ShapeType.Triangle,
        fillColor: { light: '#fce4ec', dark: '#880e4f' },
        strokeColor: { light: '#c62828', dark: '#ef9a9a' },
        strokeWidth: 2,
      })
    );

    // Slide 3 Background Frame and Content
    await this.editor.addObject(
      new KritzelShape({
        translateX: 2000,
        translateY: -225,
        width: 800,
        height: 450,
        shapeType: ShapeType.Rectangle,
        fillColor: { light: '#ffffff', dark: '#1b1b1e' },
        strokeColor: { light: '#dd0031', dark: '#b30027' },
        strokeWidth: 4,
      })
    );

    await this.editor.addObject(
      new KritzelText({
        text: 'Seamless Bounded Layouts',
        translateX: 2050,
        translateY: -150,
        fontSize: 36,
        fontColor: { light: '#dd0031', dark: '#ff4d6d' },
      })
    );

    await this.editor.addObject(
      new KritzelText({
        text: 'By setting finite limits on the viewport bounds, the user can draw and interact inside the slide card, but cannot pan away to empty space.\n\nCombined with pan animation flows, this makes a wonderful presentation experience.',
        translateX: 2050,
        translateY: -50,
        fontSize: 20,
        fontColor: { light: '#333333', dark: '#eeeeee' },
      })
    );

    // Decorative shape Slide 3
    await this.editor.addObject(
      new KritzelShape({
        translateX: 2600,
        translateY: 50,
        width: 100,
        height: 100,
        shapeType: ShapeType.Rectangle,
        fillColor: { light: '#e8f5e9', dark: '#1b5e20' },
        strokeColor: { light: '#2e7d32', dark: '#a5d6a7' },
        strokeWidth: 2,
      })
    );
  }

  async goToPrevSlide() {
    if (this.currentSlideIndex() > 0) {
      const targetIndex = this.currentSlideIndex() - 1;
      this.currentSlideIndex.set(targetIndex);
      await this.navigateToSlide(targetIndex);
    }
  }

  async goToNextSlide() {
    if (this.currentSlideIndex() < this.slides.length - 1) {
      const targetIndex = this.currentSlideIndex() + 1;
      this.currentSlideIndex.set(targetIndex);
      await this.navigateToSlide(targetIndex);
    }
  }

  private async navigateToSlide(index: number) {
    const slide = this.slides[index];
    // Smoothly pan search viewport to target center coordinates, keeping scale at 0.85
    // so the slide is slightly smaller than the viewport, showing a nice external frame margin.
    await this.editor.setViewport(slide.centerX, slide.centerY, 0.85);
  }
}
