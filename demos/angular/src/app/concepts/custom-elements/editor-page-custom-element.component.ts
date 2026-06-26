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
  KritzelCustomElement,
  KritzelCustomElementRendererRegistry,
  KritzelEditor,
} from 'kritzel-angular';
import { angularThemeLight } from '../../const/angular-theme-light';
import { angularThemeDark } from '../../const/angular-theme-dark';
import { createTodoListInitialState, TodoListComponent, TodoListState } from './todo-list.component';

const TODO_RENDERER_KEY = 'angular-todo-list';

type TodoRendererContext = {
  object: KritzelCustomElement;
  container: HTMLElement | null;
  data?: unknown;
};

@Component({
  selector: 'app-editor-page-custom-element',
  imports: [KritzelEditor],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <kritzel-editor
      [theme]="'angular-theme'"
      [themes]="themes"
      (isReady)="onReady($event)"
    ></kritzel-editor>
  `,
})
export class EditorPageCustomElementComponent implements OnDestroy {
  @ViewChild(KritzelEditor) editor!: KritzelEditor;

  private readonly appRef = inject(ApplicationRef);
  private readonly environmentInjector = inject(EnvironmentInjector);
  private readonly mountedTodoComponents = new Map<string, ComponentRef<TodoListComponent>>();
  private hasAddedInitialCustomElement = false;

  themes = [angularThemeLight, angularThemeDark];

  constructor() {
    KritzelCustomElementRendererRegistry.register(TODO_RENDERER_KEY, {
      onMount: ({ object, container, data }: TodoRendererContext) => {
        if (!container) {
          return;
        }

        let componentRef = this.mountedTodoComponents.get(object.id);
        const isFirstMount = !componentRef;

        if (!componentRef) {
          componentRef = createComponent(TodoListComponent, {
            environmentInjector: this.environmentInjector,
          });
          this.appRef.attachView(componentRef.hostView);
          this.mountedTodoComponents.set(object.id, componentRef);
        }

        if (isFirstMount) {
          componentRef.instance.initializeFromState(data as TodoListState | undefined);
        }
        componentRef.changeDetectorRef.detectChanges();

        container.innerHTML = '';
        container.appendChild(componentRef.location.nativeElement);
      },
      onUnmount: ({ object, container }: TodoRendererContext) => {
        const componentRef = this.mountedTodoComponents.get(object.id);
        
        if (!componentRef) {
          return undefined;
        }

        const nextState = componentRef.instance.exportState();

        this.appRef.detachView(componentRef.hostView);
        componentRef.destroy();
        this.mountedTodoComponents.delete(object.id);

        if (container) {
          container.innerHTML = '';
        }

        return nextState;
      },
    });
  }

  async onReady(_event: CustomEvent<EditorIsReadyEvent>): Promise<void> {
    if (this.hasAddedInitialCustomElement) {
      return;
    }

    const objectCount = await this.editor.getObjectsTotalCount();
    if (objectCount > 0) {
      return;
    }

    this.hasAddedInitialCustomElement = true;

    const placeholder = document.createElement('div');
    placeholder.textContent = 'Loading Todo List...';

    const customElement = new KritzelCustomElement({
      element: placeholder,
      rendererKey: TODO_RENDERER_KEY,
      rendererData: createTodoListInitialState(),
      translateX: -300,
      translateY: -180,
      width: 600,
      height: 380,
    });

    customElement.isRotatable = false;

    await this.editor.addObject(customElement);
  }

  ngOnDestroy(): void {
    this.mountedTodoComponents.forEach((componentRef) => {
      this.appRef.detachView(componentRef.hostView);
      componentRef.destroy();
    });
    this.mountedTodoComponents.clear();

    KritzelCustomElementRendererRegistry.unregister(TODO_RENDERER_KEY);
  }
}
