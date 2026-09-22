import { ChangeDetectionStrategy, Component, signal } from '@angular/core';

import {
  KritzelEditor,
  KritzelIframeObject,
  KritzelWorkspace,
} from '@kritzel/angular-editor';
import { angularThemeDark } from '../../../const/angular-theme-dark';
import { angularThemeLight } from '../../../const/angular-theme-light';

interface RuntimeIframeDefinition {
  name: string;
  html: string;
  css: string;
  script: string;
  initialState: Record<string, unknown>;
}

const MOCK_COMPONENT_DEFINITIONS: RuntimeIframeDefinition[] = [
  {
    name: 'Launch checklist',
    html: `
      <main class="card checklist-card">
        <p class="eyebrow">Generated workspace</p>
        <h2>Launch checklist</h2>
        <p class="summary">A mocked LLM response rendered in a sandboxed iframe.</p>
        <button id="progress-button" type="button">Mark next item complete</button>
        <p id="progress" class="progress"></p>
      </main>
    `,
    css: `
      :root { color: #18312b; background: #e9f4ed; }
      .card { box-sizing: border-box; min-height: 100%; padding: 20px; background: #e9f4ed; }
      .eyebrow { margin: 0 0 12px; color: #267352; font-size: 11px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; }
      h2 { margin: 0; font-size: 22px; }
      .summary { margin: 10px 0 24px; color: #466158; font-size: 13px; line-height: 1.5; }
      button { border: 0; border-radius: 6px; padding: 10px 12px; background: #167a50; color: #ffffff; cursor: pointer; font: inherit; font-weight: 700; }
      .progress { margin: 16px 0 0; color: #267352; font-size: 13px; font-weight: 700; }
    `,
    script: `
      const progress = document.querySelector('#progress');
      const render = () => {
        const completed = Number(kritzel.state.completed ?? 0);
        progress.textContent = completed === 3 ? 'All three items are ready.' : completed + ' of 3 items complete';
      };
      document.querySelector('#progress-button').addEventListener('click', () => {
        const completed = Math.min(Number(kritzel.state.completed ?? 0) + 1, 3);
        kritzel.setState({ completed });
        render();
      });
      addEventListener('kritzelstatechange', render);
      render();
    `,
    initialState: { completed: 0 },
  },
  {
    name: 'Focus timer',
    html: `
      <main class="card timer-card">
        <p class="eyebrow">Generated workspace</p>
        <h2>Focus timer</h2>
        <p class="summary">The mock response replaced the iframe definition without recreating the canvas object.</p>
        <div id="minutes" class="minutes"></div>
        <button id="add-button" type="button">Add five minutes</button>
      </main>
    `,
    css: `
      :root { color: #33234d; background: #f3effa; }
      .card { box-sizing: border-box; min-height: 100%; padding: 20px; background: #f3effa; }
      .eyebrow { margin: 0 0 12px; color: #7848a1; font-size: 11px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; }
      h2 { margin: 0; font-size: 22px; }
      .summary { margin: 10px 0 20px; color: #625372; font-size: 13px; line-height: 1.5; }
      .minutes { margin-bottom: 20px; color: #7848a1; font-size: 34px; font-weight: 800; }
      button { border: 1px solid #7848a1; border-radius: 6px; padding: 10px 12px; background: #ffffff; color: #593278; cursor: pointer; font: inherit; font-weight: 700; }
    `,
    script: `
      const minutes = document.querySelector('#minutes');
      const render = () => {
        minutes.textContent = String(Number(kritzel.state.minutes ?? 25)) + ' min';
      };
      document.querySelector('#add-button').addEventListener('click', () => {
        kritzel.setState({ minutes: Number(kritzel.state.minutes ?? 25) + 5 });
        render();
      });
      addEventListener('kritzelstatechange', render);
      render();
    `,
    initialState: { minutes: 25 },
  },
];

@Component({
  selector: 'app-dynamic-objects-iframe',
  imports: [KritzelEditor],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="toolbar">
      <button type="button" (click)="applyMockLlmResponse()">Mock LLM response</button>
      <span>Replace the sandboxed component definition while preserving its canvas object.</span>
    </div>
    <kritzel-editor
      editorId="dynamic-objects-iframe"
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
    .toolbar { display: flex; align-items: center; gap: 12px; padding: 8px 12px; background: #f5f5f5; border-bottom: 1px solid #ebebeb; font: 13px Roboto, sans-serif; }
    .toolbar button { border: 1px solid #dd0031; border-radius: 6px; padding: 6px 10px; background: #ffffff; color: #dd0031; cursor: pointer; font: inherit; font-weight: 700; }
    .toolbar span { color: #555; }
    kritzel-editor { flex: 1; min-height: 0; }
  `],
})
export class DynamicObjectsIframeComponent {
  private currentDefinitionIndex = 0;
  private readonly runtimeObject = this.createRuntimeObject();

  themes = [angularThemeLight, angularThemeDark];
  workspaces = signal([
    new KritzelWorkspace({ objects: [this.runtimeObject] }),
  ]);

  applyMockLlmResponse(): void {
    this.currentDefinitionIndex = (this.currentDefinitionIndex + 1) % MOCK_COMPONENT_DEFINITIONS.length;
    const definition = MOCK_COMPONENT_DEFINITIONS[this.currentDefinitionIndex];

    this.runtimeObject.setState(definition.initialState);
    this.runtimeObject.setContent(definition);
  }

  private createRuntimeObject(): KritzelIframeObject {
    const definition = MOCK_COMPONENT_DEFINITIONS[0];
    const iframeObject = new KritzelIframeObject({
      ...definition,
      state: definition.initialState,
      title: `Sandboxed ${definition.name} component`,
      translateX: -180,
      translateY: -120,
      width: 360,
      height: 240,
    });

    iframeObject.isRotatable = false;
    return iframeObject;
  }
}
