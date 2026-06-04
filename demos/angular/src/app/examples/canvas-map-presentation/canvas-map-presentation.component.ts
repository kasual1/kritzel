import { ChangeDetectionStrategy, Component, signal, computed, ViewChild } from '@angular/core';
import { 
  KritzelEditor, 
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
  selector: 'app-canvas-map-presentation',
  imports: [KritzelEditor],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header class="presentation-header">
      <div class="brand">
        <span class="badge">Prezi Mode</span>
        <h1 class="title">Canvas Map Presentation</h1>
      </div>
      
      <div class="controls-group">
        <div class="nav-buttons">
          <button 
            [disabled]="currentSlideIndex() === 0 || isTransitioning()" 
            (click)="goToPrevSlide()"
            class="nav-btn"
          >
            Previous
          </button>
          <span class="slide-indicator bg-badge">
            @if (isTransitioning()) {
              ⚡ Zooming...
            } @else {
              Node <strong>{{ currentSlideIndex() + 1 }}</strong> of {{ slides.length }}
            }
          </span>
          <button 
            [disabled]="currentSlideIndex() === slides.length - 1 || isTransitioning()" 
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
        editorId="canvas-map-presentation"
        [theme]="'angular-theme'"
        [themes]="themes"
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
export class CanvasMapPresentationComponent {
  @ViewChild(KritzelEditor) editor!: KritzelEditor;

  themes = [angularThemeLight, angularThemeDark];

  

  slides: Slide[] = [
    { title: '1. Welcome to Canvas Map', centerX: 0, centerY: 0 },
    { title: '2. Nonlinear Paths', centerX: 1200, centerY: 800 },
    { title: '3. Deep Zoom Narrative', centerX: -600, centerY: 1500 },
  ];

  isTransitioning = signal<boolean>(false);
  currentSlideIndex = signal<number>(0);
  private previousSlideIndex: number | null = null;

  async onReady() {
    const existing = await this.editor.getAllObjects();
    if (existing.length === 0) {
      await this.seedSlides();
    }
    // Set initial viewport directly
    await this.navigateToSlide(0);
  }

  async seedSlides() {
    // Slide 1 Background Frame and Content (0, 0)
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
        text: 'Welcome to Canvas Maps',
        translateX: -350,
        translateY: -150,
        fontSize: 36,
        fontColor: { light: '#dd0031', dark: '#ff4d6d' },
      })
    );

    await this.editor.addObject(
      new KritzelText({
        text: 'Prezi-style cinematic transitions navigate across 2D diagonal coordinates, zooming out to capture a bird\'s-eye view of the entire path before zooming back in on successive cards.\n\nUse the next or previous controls above to trigger cinematic pan/zoom transitions!',
        translateX: -350,
        translateY: -50,
        fontSize: 18,
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

    // Slide 2 Background Frame and Content (1200, 800)
    await this.editor.addObject(
      new KritzelShape({
        translateX: 800,
        translateY: 575,
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
        text: 'Nonlinear Coordinate Slopes',
        translateX: 850,
        translateY: 650,
        fontSize: 36,
        fontColor: { light: '#dd0031', dark: '#ff4d6d' },
      })
    );

    await this.editor.addObject(
      new KritzelText({
        text: 'Rather than sitting on a simple straight horizontal track, presentation nodes can reside anywhere in world space coordinate slots.\n\nTo make this zooming transition work smoothly, camera boundaries are suspended temporarily while flying, and re-clamped strictly on arrival.',
        translateX: 850,
        translateY: 750,
        fontSize: 18,
        fontColor: { light: '#333333', dark: '#eeeeee' },
      })
    );

    // Decorative shape Slide 2
    await this.editor.addObject(
      new KritzelShape({
        translateX: 1400,
        translateY: 850,
        width: 120,
        height: 100,
        shapeType: ShapeType.Triangle,
        fillColor: { light: '#fce4ec', dark: '#880e4f' },
        strokeColor: { light: '#c62828', dark: '#ef9a9a' },
        strokeWidth: 2,
      })
    );

    // Slide 3 Background Frame and Content (-600, 1500)
    await this.editor.addObject(
      new KritzelShape({
        translateX: -1000,
        translateY: 1275,
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
        text: 'Cinematic Path Integration',
        translateX: -950,
        translateY: 1350,
        fontSize: 36,
        fontColor: { light: '#dd0031', dark: '#ff4d6d' },
      })
    );

    await this.editor.addObject(
      new KritzelText({
        text: 'By combining coordinate-based panning, dynamic multi-stage viewport scales, and automatic target boundary activation, developers can build incredibly immersive guides.\n\nDraw drawings or jot nodes down inside any slide card, completely bounded!',
        translateX: -950,
        translateY: 1450,
        fontSize: 18,
        fontColor: { light: '#333333', dark: '#eeeeee' },
      })
    );

    // Decorative shape Slide 3
    await this.editor.addObject(
      new KritzelShape({
        translateX: -400,
        translateY: 1550,
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
    if (this.currentSlideIndex() > 0 && !this.isTransitioning()) {
      const targetIndex = this.currentSlideIndex() - 1;
      this.currentSlideIndex.set(targetIndex);
      await this.navigateToSlide(targetIndex);
    }
  }

  async goToNextSlide() {
    if (this.currentSlideIndex() < this.slides.length - 1 && !this.isTransitioning()) {
      const targetIndex = this.currentSlideIndex() + 1;
      this.currentSlideIndex.set(targetIndex);
      await this.navigateToSlide(targetIndex);
    }
  }

  private async navigateToSlide(index: number) {
    const slide = this.slides[index];
    this.previousSlideIndex = index;

    // Set transition state to true so boundary bindings release
    this.isTransitioning.set(true);

    // Smoothly pan and zoom directly to target slide center at presentation scale (0.85) in a single fluid gesture
    await this.editor.setViewport(slide.centerX, slide.centerY, 0.85);

    // Wait for the native duration animation (150ms) to complete
    await new Promise((resolve) => setTimeout(resolve, 250));

    // Re-lock boundaries tightly to target slide bounds
    this.isTransitioning.set(false);
  }
}
