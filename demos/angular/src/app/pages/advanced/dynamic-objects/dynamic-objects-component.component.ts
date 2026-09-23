import {
  ApplicationRef,
  ChangeDetectionStrategy,
  Component,
  ComponentRef,
  EnvironmentInjector,
  OnDestroy,
  createComponent,
  inject,
  signal,
} from '@angular/core';

import {
  KritzelDynamicObject,
  KritzelDynamicObjectRendererRegistry,
  KritzelEditor,
  KritzelWorkspace,
} from '@kritzel/angular-editor';
import { angularThemeLight } from '../../../const/angular-theme-light';
import { angularThemeDark } from '../../../const/angular-theme-dark';
import { CalculatorWidgetComponent, CalculatorWidgetState, createCalculatorWidgetInitialState } from './calculator-widget.component';

const CALCULATOR_RENDERER_KEY = 'angular-dynamic-object-calculator';

type CalculatorRendererContext = {
  object: KritzelDynamicObject;
  container: HTMLElement | null;
  data?: unknown;
};

@Component({
  selector: 'app-dynamic-objects-component',
  imports: [KritzelEditor],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <kritzel-editor
      editorId="dynamic-objects-component"
      [theme]="'light'"
      [themes]="themes"
      [isPanningEnabled]="false"
      [isZoomingEnabled]="false"
      [isMoreMenuVisible]="false"
      [isWorkspaceManagerVisible]="false"
      [workspaces]="workspaces()"
    ></kritzel-editor>
  `,
  styles: [`
    :host { display: flex; flex-direction: column; height: 100%; }
    .toolbar-note { display: flex; align-items: center; gap: 8px; padding: 8px 12px; background: #f5f5f5; border-bottom: 1px solid #ebebeb; font: 13px Roboto, sans-serif; }
    .toolbar-note strong { color: #dd0031; }
    .toolbar-note span { color: #555; }
    kritzel-editor { flex: 1; min-height: 0; }
  `],
})
export class DynamicObjectsComponentComponent implements OnDestroy {
  private readonly appRef = inject(ApplicationRef);
  private readonly environmentInjector = inject(EnvironmentInjector);
  private readonly mountedCalculators = new Map<string, ComponentRef<CalculatorWidgetComponent>>();

  themes = [angularThemeLight, angularThemeDark];
  workspaces = signal([
    new KritzelWorkspace({ objects: [this.createInitialDynamicObject()] }),
  ]);

  constructor() {
    KritzelDynamicObjectRendererRegistry.register(CALCULATOR_RENDERER_KEY, {
      onMount: ({ object, container, data }: CalculatorRendererContext) => {
        if (!container) {
          return;
        }

        container.style.overflow = 'visible';

        let componentRef = this.mountedCalculators.get(object.id);
        const isFirstMount = !componentRef;

        if (!componentRef) {
          componentRef = createComponent(CalculatorWidgetComponent, {
            environmentInjector: this.environmentInjector,
          });
          this.appRef.attachView(componentRef.hostView);
          this.mountedCalculators.set(object.id, componentRef);
        }

        if (isFirstMount) {
          componentRef.instance.initializeFromState(data as CalculatorWidgetState | undefined);
        }
        componentRef.changeDetectorRef.detectChanges();

        container.innerHTML = '';
        container.appendChild(componentRef.location.nativeElement);
      },
      onSerialize: ({ object, data }: CalculatorRendererContext) => {
        return this.mountedCalculators.get(object.id)?.instance.exportState() ?? data ?? createCalculatorWidgetInitialState();
      },
      onUnmount: ({ object, container }: CalculatorRendererContext) => {
        const componentRef = this.mountedCalculators.get(object.id);

        if (!componentRef) {
          return undefined;
        }

        const nextState = componentRef.instance.exportState();

        this.appRef.detachView(componentRef.hostView);
        componentRef.destroy();
        this.mountedCalculators.delete(object.id);

        if (container) {
          container.innerHTML = '';
        }

        return nextState;
      },
    });
  }

  private createInitialDynamicObject(): KritzelDynamicObject {
    const placeholder = document.createElement('div');
    placeholder.textContent = 'Loading Calculator...';

    const dynamicObject = new KritzelDynamicObject({
      element: placeholder,
      rendererKey: CALCULATOR_RENDERER_KEY,
      rendererData: createCalculatorWidgetInitialState(),
      translateX: -130,
      translateY: -190,
      width: 260,
      height: 320,
    });

    dynamicObject.isRotatable = false;

    return dynamicObject;
  }

  ngOnDestroy(): void {
    this.mountedCalculators.forEach((componentRef) => {
      this.appRef.detachView(componentRef.hostView);
      componentRef.destroy();
    });
    this.mountedCalculators.clear();

    KritzelDynamicObjectRendererRegistry.unregister(CALCULATOR_RENDERER_KEY);
  }
}
