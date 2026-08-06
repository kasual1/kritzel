import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnDestroy,
  signal,
  ViewChild,
} from '@angular/core';
import {
  EditorIsReadyEvent,
  KritzelBrushTool,
  KritzelEditor,
  KritzelImage,
  KritzelTextTool,
  KritzelTheme,
  KritzelViewportState,
} from 'kritzel-angular';
import {
  LucideMinus,
  LucidePlus,
  LucideRedo2,
  LucideUndo2,
} from '@lucide/angular';
import { angularThemeDark } from '../../const/angular-theme-dark';
import { angularThemeLight } from '../../const/angular-theme-light';

type AnnotationMode = 'sketch' | 'text';

type ColorTool = {
  name: string;
  label: string;
  color: string;
};

@Component({
  selector: 'app-image-annotation-studio',
  imports: [KritzelEditor, LucideMinus, LucidePlus, LucideRedo2, LucideUndo2],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="annotation-page">
      <kritzel-editor
        #editorHost
        editorId="image-annotation-studio"
        [themes]="themes"
        [theme]="'annotation-theme-dark'"
        [scaleMax]="10"
        [scaleMin]="0.1"
        [isPanningEnabled]="false"
        [isZoomingEnabled]="false"
        [isControlsVisible]="false"
        [isMoreMenuVisible]="false"
        [isWorkspaceManagerVisible]="false"
        [isUtilityPanelVisible]="false"
        [isZoomPanelVisible]="false"
        (isReady)="onReady($event)"
      ></kritzel-editor>

      <div class="action-bar">
        <button
          class="action-btn icon-btn"
          type="button"
          aria-label="Undo"
          (click)="undo()"
        >
          <svg lucideUndo2 [size]="16" [strokeWidth]="2.25"></svg>
        </button>
        <button
          class="action-btn icon-btn"
          type="button"
          aria-label="Redo"
          (click)="redo()"
        >
          <svg lucideRedo2 [size]="16" [strokeWidth]="2.25"></svg>
        </button>
        <button class="action-btn primary" type="button" (click)="download()">
          Download
        </button>
      </div>

      <div class="zoom-bar" aria-label="Zoom controls">
        <button
          class="action-btn zoom-btn"
          type="button"
          aria-label="Zoom out"
          (click)="zoomOut()"
        >
          <svg lucideMinus [size]="16" [strokeWidth]="2.25"></svg>
        </button>
        <button
          class="action-btn zoom-btn"
          type="button"
          aria-label="Zoom in"
          (click)="zoomIn()"
        >
          <svg lucidePlus [size]="16" [strokeWidth]="2.25"></svg>
        </button>
      </div>

      <div class="tool-dock">
        <div class="swatch-row">
          @for (tool of colorTools; track tool.name) {
            <button
              class="swatch-btn"
              [class.active]="activeSketchTool() === tool.name"
              [style.background]="tool.color"
              (click)="activateColorTool(tool.name)"
              [attr.aria-label]="'Activate ' + tool.label + ' sketch tool'"
              type="button"
            ></button>
          }
        </div>

        <div class="mode-row" role="tablist" aria-label="Annotation mode">
          <button
            class="mode-btn"
            [class.active]="activeMode() === 'sketch'"
            (click)="activateMode('sketch')"
            type="button"
          >
            Sketch
          </button>
          <button
            class="mode-btn"
            [class.active]="activeMode() === 'text'"
            (click)="activateMode('text')"
            type="button"
          >
            Text
          </button>
        </div>
      </div>
    </div>
  `,
  styles: `
    :host {
      display: block;
      width: 100%;
      height: 100%;
      color: #eef2ff;
      background:
        radial-gradient(
          circle at 15% 20%,
          rgba(251, 146, 60, 0.14),
          transparent 40%
        ),
        radial-gradient(
          circle at 85% 78%,
          rgba(59, 130, 246, 0.16),
          transparent 38%
        ),
        linear-gradient(120deg, #0d111a 0%, #181c2a 52%, #0f1724 100%);
      font-family: 'Segoe UI', sans-serif;
    }

    .annotation-page {
      position: relative;
      height: 100%;
      width: 100%;
      overflow: hidden;
    }

    kritzel-editor {
      display: block;
      width: 100%;
      height: 100%;
    }

    .tool-dock {
      position: absolute;
      left: 50%;
      bottom: 18px;
      transform: translateX(-50%);
      z-index: 20;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 12px;
      pointer-events: none;
    }

    .tool-dock > * {
      pointer-events: auto;
    }

    .action-bar {
      position: absolute;
      top: 16px;
      right: 16px;
      z-index: 24;
      display: flex;
      align-items: center;
      gap: 8px;
      pointer-events: none;
    }

    .action-bar > * {
      pointer-events: auto;
    }

    .zoom-bar {
      position: absolute;
      left: 16px;
      bottom: 16px;
      z-index: 24;
      display: flex;
      align-items: center;
      gap: 8px;
      pointer-events: none;
    }

    .zoom-bar > * {
      pointer-events: auto;
    }

    .action-btn {
      height: 34px;
      padding: 0 14px;
      border-radius: 999px;
      border: 1px solid rgba(255, 255, 255, 0.2);
      background: rgba(10, 16, 28, 0.78);
      color: #e2e8f0;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      transition: all 120ms ease;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.28);
    }

    .action-btn:hover {
      background: rgba(15, 23, 42, 0.95);
      border-color: rgba(255, 255, 255, 0.32);
    }

    .action-btn.primary {
      background: rgba(221, 0, 49, 0.92);
      border-color: rgba(255, 255, 255, 0.35);
      color: #ffffff;
    }

    .action-btn.primary:hover {
      background: rgba(179, 0, 40, 0.96);
    }

    .zoom-btn {
      width: 34px;
      padding: 0;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .icon-btn {
      width: 34px;
      padding: 0;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .zoom-btn svg {
      display: block;
    }

    .icon-btn svg {
      display: block;
    }

    .swatch-row {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 8px 12px;
      border-radius: 999px;
      background: rgba(11, 16, 27, 0.84);
      border: 1px solid rgba(255, 255, 255, 0.15);
      box-shadow: 0 12px 32px rgba(0, 0, 0, 0.35);
    }

    .swatch-btn {
      width: 26px;
      height: 26px;
      border-radius: 50%;
      border: 2px solid rgba(255, 255, 255, 0.22);
      cursor: pointer;
      transition: transform 120ms ease;
    }

    .swatch-btn:hover {
      transform: translateY(-1px);
    }

    .swatch-btn.active {
      border-color: #ffffff;
      box-shadow:
        0 0 0 2px rgba(255, 255, 255, 0.25),
        0 0 0 6px rgba(255, 255, 255, 0.07);
    }

    .mode-row {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 6px;
      border-radius: 999px;
      background: rgba(11, 16, 27, 0.84);
      border: 1px solid rgba(255, 255, 255, 0.15);
      box-shadow: 0 12px 32px rgba(0, 0, 0, 0.35);
    }

    .mode-btn {
      min-width: 96px;
      padding: 10px 14px;
      border: none;
      border-radius: 999px;
      background: rgba(255, 255, 255, 0.08);
      color: #dbeafe;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      transition: all 120ms ease;
    }

    .mode-btn:hover {
      background: rgba(255, 255, 255, 0.14);
    }

    .mode-btn.active {
      background: #ffffff;
      color: #0f172a;
    }

    @media (max-width: 900px) {
      .tool-dock {
        bottom: 12px;
      }

      .action-bar {
        top: 12px;
        right: 12px;
      }

      .zoom-bar {
        left: 12px;
        bottom: 12px;
      }

      .action-btn {
        height: 30px;
        padding: 0 10px;
        font-size: 12px;
      }

      .zoom-btn {
        width: 30px;
        padding: 0;
      }

      .icon-btn {
        width: 30px;
        padding: 0;
      }

      .swatch-row {
        gap: 8px;
      }

      .swatch-btn {
        width: 22px;
        height: 22px;
      }
    }
  `,
})
export class ImageAnnotationStudioComponent {
  @ViewChild(KritzelEditor) editor!: KritzelEditor;
  @ViewChild('editorHost', { read: ElementRef })
  editorHost!: ElementRef<HTMLElement>;

  readonly annotationThemeDark: KritzelTheme = {
    ...angularThemeDark,
    name: 'annotation-theme-dark',
    engine: {
      ...angularThemeDark.engine,
      backgroundColor: '#090f18',
      loadingOverlayBackground: 'rgba(9, 15, 24, 0.72)',
    },
  };

  readonly themes = [
    this.annotationThemeDark,
    angularThemeLight,
    angularThemeDark,
  ];

  readonly colorTools: ColorTool[] = [
    { name: 'ink-black', label: 'Black', color: '#030712' },
    { name: 'ink-red', label: 'Red', color: '#f15f54' },
    { name: 'ink-yellow', label: 'Yellow', color: '#eab308' },
    { name: 'ink-green', label: 'Green', color: '#4ade80' },
    { name: 'ink-cyan', label: 'Cyan', color: '#38bdf8' },
    { name: 'ink-violet', label: 'Violet', color: '#c084fc' },
    { name: 'ink-gray', label: 'Gray', color: '#d1d5db' },
  ];

  readonly activeMode = signal<AnnotationMode>('sketch');
  readonly activeSketchTool = signal<string>('ink-red');

  private imageObjectId = 'annotation-scene-image';

  async onReady(_event: CustomEvent<EditorIsReadyEvent>) {
    await this.registerColorTools();
    await this.ensureSeedImage();
    await this.activateColorTool(this.activeSketchTool());
  }

  async activateColorTool(toolName: string) {
    this.activeSketchTool.set(toolName);
    this.activeMode.set('sketch');
    await this.syncTextColorToActiveSketchTool();
    await this.editor.changeActiveToolByName(toolName);
  }

  async activateMode(mode: AnnotationMode) {
    this.activeMode.set(mode);

    if (mode === 'text') {
      await this.syncTextColorToActiveSketchTool();
      await this.editor.changeActiveToolByName('text');
      return;
    }

    await this.editor.changeActiveToolByName(this.activeSketchTool());
  }

  async undo() {
    await this.editor.undo();
  }

  async download() {
    await this.editor.exportViewportAsPng({
      includeBackground: false
    });
  }

  async redo() {
    await this.editor.redo();
  }

  async zoomIn() {
    await this.editor.zoomIn();
  }

  async zoomOut() {
    await this.editor.zoomOut();
  }

  async save() {
    await this.editor.downloadAsJson('image-annotation-studio');
  }

  private async registerColorTools() {
    for (const tool of this.colorTools) {
      await this.editor.registerTool(tool.name, KritzelBrushTool, {
        type: 'pen',
        color: {
          light: tool.color,
          dark: tool.color,
        },
        size: 5,
        palettes: {
          pen: [
            {
              light: tool.color,
              dark: tool.color,
              label: tool.label,
            },
          ],
        },
      });
    }
  }

  private async syncTextColorToActiveSketchTool() {
    const activeSketchColor =
      this.colorTools.find((tool) => tool.name === this.activeSketchTool())
        ?.color ?? this.colorTools[0].color;

    const textColor = {
      light: activeSketchColor,
      dark: activeSketchColor,
    };

    // registerTool updates existing tools in-place, which lets us keep text color
    // aligned with the currently selected sketch swatch.
    const textToolConfig = {
      fontColor: textColor,
    } as unknown as Parameters<KritzelEditor['registerTool']>[2];

    await this.editor.registerTool('text', KritzelTextTool, textToolConfig);
  }

  private async ensureSeedImage() {
    const image = await KritzelImage.fromUrl(
      'https://images.unsplash.com/photo-1547891654-e66ed7ebb968?auto=format&fit=crop&w=1800&q=80',
      {
        maxWidth: 660,
        maxHeight: 360,
      },
    );

    image.translateX = -image.width / 2;
    image.translateY = (-image.height / 2) - 50;

    await this.editor.addObject(image);
  }
}
