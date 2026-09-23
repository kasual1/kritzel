import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { KritzelEditor, KritzelLocale, KritzelWorkspace, LocaleCode } from '@kritzel/angular-editor';
import { createSeedObjects } from '../../../const/seed-objects';
import { ToolbarComponent } from '../../../components/toolbar.component';
import { angularThemeDark } from '../../../const/angular-theme-dark';
import { angularThemeLight } from '../../../const/angular-theme-light';

const spanishLocale: KritzelLocale = {
  code: 'es',
  label: 'Español',
  terms: {
    'menu.copy': 'Copiar',
    'menu.cut': 'Cortar',
    'menu.paste': 'Pegar',
    'menu.selectAll': 'Seleccionar todo',
    'menu.order': 'Ordenar',
    'menu.bringToFront': 'Traer al frente',
    'menu.sendToBack': 'Enviar al fondo',
    'menu.delete': 'Eliminar',
    'menu.share': 'Compartir',
    'menu.import': 'Importar',
    'menu.settings': 'Configuración',
    'settings.dialogTitle': 'Configuración del Editor',
    'export.dialogTitle': 'Exportar Lienzo',
    'zoom.zoomIn': 'Acercar',
    'zoom.zoomOut': 'Alejar',
    'utility.undo': 'Deshacer',
    'utility.redo': 'Rehacer',
  },
};

@Component({
  selector: 'app-localization-custom',
  imports: [KritzelEditor, ToolbarComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-toolbar>
      <button [class.active]="activeLocale() === 'es'" (click)="setLocale('es')">Español</button>
    </app-toolbar>
    <div class="editor-wrap">
      <kritzel-editor
        editorId="localization-custom"
        [locales]="customLocales"
        [locale]="activeLocale()"
        [workspaces]="workspaces()"
        [theme]="'light'"
        [themes]="themes"
        [isPanningEnabled]="false"
        [isZoomingEnabled]="false"
        [isMoreMenuVisible]="true"
        [isWorkspaceManagerVisible]="true"
      ></kritzel-editor>
    </div>
  `,
  styles: [`
    :host { display: flex; flex-direction: column; height: 100%; font-family: Roboto, sans-serif; }
    .editor-wrap { flex: 1; position: relative; }
    .status-bar { display: flex; align-items: center; gap: 12px; padding: 8px 12px; background: #f5f5f5; border-top: 1px solid #ebebeb; font-size: 13px; font-family: monospace; }
  `],
})
export class LocalizationCustomComponent {
  themes = [angularThemeLight, angularThemeDark];

  workspaces = signal([new KritzelWorkspace({ objects: createSeedObjects() })]);
  
  customLocales: KritzelLocale[] = [spanishLocale];
  
  activeLocale = signal<LocaleCode>('es');

  setLocale(locale: LocaleCode) {
    this.activeLocale.set(locale);
  }
}
