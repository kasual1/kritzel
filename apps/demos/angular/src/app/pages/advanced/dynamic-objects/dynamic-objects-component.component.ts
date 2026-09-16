import {
  ApplicationRef,
  ChangeDetectionStrategy,
  Component,
  ComponentRef,
  EnvironmentInjector,
  OnDestroy,
  ViewChild,
  createComponent,
  inject,
} from '@angular/core';

import {
  EditorIsReadyEvent,
  KritzelDynamicObject,
  KritzelDynamicObjectRendererRegistry,
  KritzelEditor,
} from '@kritzel/angular-editor';
import { angularThemeLight } from '../../../const/angular-theme-light';
import { angularThemeDark } from '../../../const/angular-theme-dark';
import { CounterWidgetComponent, createCounterWidgetInitialState } from './counter-widget.component';

const COUNTER_RENDERER_KEY = 'angular-dynamic-object-counter';

type CounterRendererContext = {
  object: KritzelDynamicObject;
  container: HTMLElement | null;
  data?: unknown;
};

@Component({
  selector: 'app-dynamic-objects-component',
  imports: [KritzelEditor],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="toolbar-note">
      <strong>Registered Component:</strong>
      <span>The object mounts a real Angular component via the renderer registry.</span>
    </div>
    <kritzel-editor
      editorId="dynamic-objects-component"
      [theme]="'light'"
      [themes]="themes"
      [isPanningEnabled]="false"
      [isZoomingEnabled]="false"
      [isMoreMenuVisible]="false"
      [isWorkspaceManagerVisible]="false"
      (isReady)="onReady($event)"
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
  @ViewChild(KritzelEditor) editor!: KritzelEditor;

  private readonly appRef = inject(ApplicationRef);
  private readonly environmentInjector = inject(EnvironmentInjector);
  private readonly mountedCounters = new Map<string, ComponentRef<CounterWidgetComponent>>();
  private hasAddedInitialDynamicObject = false;

  themes = [angularThemeLight, angularThemeDark];

  constructor() {
    KritzelDynamicObjectRendererRegistry.register(COUNTER_RENDERER_KEY, {
      onMount: ({ object, container, data }: CounterRendererContext) => {
        if (!container) {
          return;
        }

        let componentRef = this.mountedCounters.get(object.id);
        const isFirstMount = !componentRef;

        if (!componentRef) {
          componentRef = createComponent(CounterWidgetComponent, {
            environmentInjector: this.environmentInjector,
          });
          this.appRef.attachView(componentRef.hostView);
          this.mountedCounters.set(object.id, componentRef);
        }

        if (isFirstMount) {
          componentRef.instance.initializeFromState(data as { count: number } | undefined);
        }
        componentRef.changeDetectorRef.detectChanges();

        container.innerHTML = '';
        container.appendChild(componentRef.location.nativeElement);
      },
      onUnmount: ({ object, container }: CounterRendererContext) => {
        const componentRef = this.mountedCounters.get(object.id);

        if (!componentRef) {
          return undefined;
        }

        const nextState = componentRef.instance.exportState();

        this.appRef.detachView(componentRef.hostView);
        componentRef.destroy();
        this.mountedCounters.delete(object.id);

        if (container) {
          container.innerHTML = '';
        }

        return nextState;
      },
    });
  }

  async onReady(_event: CustomEvent<EditorIsReadyEvent>): Promise<void> {
    if (this.hasAddedInitialDynamicObject) {
      return;
    }

    const objectCount = await this.editor.getObjectsTotalCount();
    if (objectCount > 0) {
      return;
    }

    this.hasAddedInitialDynamicObject = true;

    const placeholder = document.createElement('div');
    placeholder.textContent = 'Loading Counter...';

    const dynamicObject = new KritzelDynamicObject({
      element: placeholder,
      rendererKey: COUNTER_RENDERER_KEY,
      rendererData: createCounterWidgetInitialState(),
      translateX: -150,
      translateY: -90,
      width: 260,
      height: 160,
    });

    dynamicObject.isRotatable = false;

    await this.editor.addObject(dynamicObject);
  }

  ngOnDestroy(): void {
    this.mountedCounters.forEach((componentRef) => {
      this.appRef.detachView(componentRef.hostView);
      componentRef.destroy();
    });
    this.mountedCounters.clear();

    KritzelDynamicObjectRendererRegistry.unregister(COUNTER_RENDERER_KEY);
  }
}
