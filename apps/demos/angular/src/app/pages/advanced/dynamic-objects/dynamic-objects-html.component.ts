import { ChangeDetectionStrategy, Component, signal } from '@angular/core';

import {
  KritzelDynamicObject,
  KritzelEditor,
  KritzelWorkspace,
} from '@kritzel/angular-editor';
import { angularThemeLight } from '../../../const/angular-theme-light';
import { angularThemeDark } from '../../../const/angular-theme-dark';

function createHtmlCounterElement(): HTMLElement {
  const root = document.createElement('section');
  root.style.cssText = [
    'display:flex',
    'flex-direction:column',
    'gap:10px',
    'padding:14px',
    'box-sizing:border-box',
    'height:100%',
    'font-family:Roboto, sans-serif',
  ].join(';');

  const heading = document.createElement('h3');
  heading.textContent = 'Native HTML Counter';
  heading.style.cssText = 'margin:0; font-size:15px;';

  const note = document.createElement('p');
  note.textContent = 'This content is plain DOM passed directly as the element, with no renderer.';
  note.style.cssText = 'margin:0; font-size:12px; color:#555;';

  const controls = document.createElement('div');
  controls.style.cssText = 'display:flex; align-items:center; gap:12px; margin-top:auto;';

  const decrementButton = document.createElement('button');
  decrementButton.type = 'button';
  decrementButton.textContent = '-';

  const countLabel = document.createElement('span');
  countLabel.style.cssText = 'font-size:20px; font-weight:700; min-width:24px; text-align:center;';

  const incrementButton = document.createElement('button');
  incrementButton.type = 'button';
  incrementButton.textContent = '+';

  [decrementButton, incrementButton].forEach((button) => {
    button.style.cssText =
      'width:32px; height:32px; border-radius:6px; border:1px solid #dd0031; background:#ffffff; color:#dd0031; cursor:pointer; font-size:16px;';
  });

  let count = 0;
  const renderCount = () => {
    countLabel.textContent = String(count);
  };
  renderCount();

  incrementButton.addEventListener('click', () => {
    count += 1;
    renderCount();
  });
  decrementButton.addEventListener('click', () => {
    count -= 1;
    renderCount();
  });

  controls.appendChild(decrementButton);
  controls.appendChild(countLabel);
  controls.appendChild(incrementButton);

  root.appendChild(heading);
  root.appendChild(note);
  root.appendChild(controls);

  return root;
}

@Component({
  selector: 'app-dynamic-objects-html',
  imports: [KritzelEditor],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="toolbar-note">
      <strong>Native HTML:</strong>
      <span>The object mounts a plain DOM element with no renderer registered.</span>
    </div>
    <kritzel-editor
      editorId="dynamic-objects-html"
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
export class DynamicObjectsHtmlComponent {
  themes = [angularThemeLight, angularThemeDark];
  workspaces = signal([
    new KritzelWorkspace({ objects: [this.createInitialDynamicObject()] }),
  ]);

  private createInitialDynamicObject(): KritzelDynamicObject {
    const dynamicObject = new KritzelDynamicObject({
      element: createHtmlCounterElement(),
      translateX: -150,
      translateY: -90,
      width: 260,
      height: 160,
    });

    dynamicObject.isRotatable = false;

    return dynamicObject;
  }
}
