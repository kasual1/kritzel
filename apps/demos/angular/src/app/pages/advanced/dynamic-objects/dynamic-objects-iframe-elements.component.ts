import { ChangeDetectionStrategy, Component, signal, viewChild } from '@angular/core';
import {
  KritzelAgent,
  KritzelEditor,
  KritzelIframeObject,
  KritzelObjectElementClickEvent,
  KritzelObjectElementHoverEvent,
  KritzelObjectElementInfo,
  KritzelObjectElementPickEvent,
  KritzelWorkspace,
} from '@kritzel/angular-editor';
import { angularThemeDark } from '../../../const/angular-theme-dark';
import { angularThemeLight } from '../../../const/angular-theme-light';
import { iframeElementsContent } from './iframe-elements-content';

const AGENT = 'agent';
const EMPTY_VALUE = '—';
const MAX_TEXT_LENGTH = 24;
// The panel is docked to the bottom-left corner and the card sits above it, so they don't overlap even in the
// 560px high docs embed. The agent starts just right of the card's top edge.
const CARD_TOP = -250;
const AGENT_START = { x: 170, y: CARD_TOP + 10 };

function describe(element: KritzelObjectElementInfo): string {
  const name = element.kritzelId ?? element.tagName;
  if (!element.text) {
    return name;
  }

  const text = element.text.length > MAX_TEXT_LENGTH ? `${element.text.slice(0, MAX_TEXT_LENGTH - 1)}…` : element.text;
  return `${name} "${text}"`;
}

@Component({
  selector: 'app-dynamic-objects-iframe-elements',
  imports: [KritzelEditor],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <kritzel-editor
      editorId="dynamic-objects-iframe-elements"
      [theme]="'light'"
      [themes]="themes"
      [isPanningEnabled]="false"
      [isZoomingEnabled]="false"
      [isToolbarVisible]="false"
      [isMoreMenuVisible]="false"
      [isWorkspaceManagerVisible]="false"
      [isZoomPanelVisible]="false"
      [workspaces]="workspaces()"
      (isReady)="onReady()"
      (objectElementHover)="onElementHover($event)"
      (objectElementClick)="onElementClick($event)"
      (objectElementPick)="onElementPick($event)"
    ></kritzel-editor>
    <section class="events-panel" aria-label="Iframe element events">
      <p class="hint">Select the card, then hover, click or pick an element.</p>
      <dl>
        <div class="row">
          <dt>Hovered</dt>
          <dd data-testid="hovered-element">{{ hovered() }}</dd>
        </div>
        <div class="row">
          <dt>Clicked</dt>
          <dd data-testid="clicked-element">{{ clicked() }}</dd>
        </div>
        <div class="row">
          <dt>Picked</dt>
          <dd data-testid="picked-element">{{ picked() }}</dd>
        </div>
      </dl>
      <div class="actions">
        <button
          type="button"
          class="toggle"
          data-testid="toggle-picking"
          [class.active]="isPicking()"
          [attr.aria-pressed]="isPicking()"
          (click)="togglePicking()"
        >{{ isPicking() ? 'Stop picking' : 'Pick element' }}</button>
        <button type="button" data-testid="highlight-controls" (click)="highlightButtons()">Highlight buttons</button>
        <button type="button" data-testid="clear-highlights" (click)="clearHighlights()">Clear</button>
      </div>
    </section>
  `,
  styles: [`
    :host { position: relative; display: block; height: 100%; }
    kritzel-editor { display: block; width: 100%; height: 100%; }
    .events-panel { position: absolute; left: 16px; bottom: 16px; z-index: 20; display: flex; flex-direction: column; gap: 8px; box-sizing: border-box; width: min(280px, calc(100% - 32px)); padding: 12px; border: 1px solid #e5e7eb; border-radius: 12px; background: #ffffff; box-shadow: 0 8px 24px rgba(32, 33, 36, 0.12); color: #202124; font-family: Roboto, system-ui, sans-serif; font-size: 13px; line-height: 1.4; }
    .hint { margin: 0; color: #5f6368; }
    dl { display: grid; gap: 4px; margin: 0; }
    .row { display: grid; grid-template-columns: 64px minmax(0, 1fr); gap: 8px; }
    dt { color: #5f6368; }
    dd { margin: 0; overflow: hidden; font-weight: 600; text-overflow: ellipsis; white-space: nowrap; }
    .actions { display: flex; flex-wrap: wrap; gap: 6px; }
    .actions > button { flex: 1 1 auto; }
    .actions > .toggle { flex-basis: 100%; }
    button { height: 28px; padding: 0 10px; border: 1px solid #dadce0; border-radius: 8px; background: #ffffff; color: #202124; cursor: pointer; font: inherit; font-weight: 600; }
    button:hover { background: #f3f4f6; }
    button.active { border-color: #dd0031; background: #dd0031; color: #ffffff; }
    button.active:hover { background: #b70028; }
  `],
})
export class DynamicObjectsIframeElementsComponent {
  private readonly editor = viewChild(KritzelEditor);
  private readonly iframeObject = this.createIframeObject();
  private readonly agent = new KritzelAgent({ id: AGENT, name: 'Agent', status: 'Pick an element', position: AGENT_START });

  themes = [angularThemeLight, angularThemeDark];
  workspaces = signal([new KritzelWorkspace({ objects: [this.iframeObject] })]);
  hovered = signal(EMPTY_VALUE);
  clicked = signal(EMPTY_VALUE);
  picked = signal(EMPTY_VALUE);
  isPicking = signal(false);

  async onReady(): Promise<void> {
    const editor = this.editor();
    if (!editor) return;

    try {
      // Hover, click and pick events are only reported while the iframe object is selected (interactive).
      await editor.selectObjects([this.iframeObject]);
      await editor.addAgent(this.agent);
    } catch (error) {
      console.warn('Could not prepare the iframe elements demo.', error);
    }
  }

  onElementHover(event: CustomEvent<KritzelObjectElementHoverEvent>): void {
    const { element } = event.detail;
    this.hovered.set(element ? describe(element) : EMPTY_VALUE);
  }

  onElementClick(event: CustomEvent<KritzelObjectElementClickEvent>): void {
    this.clicked.set(describe(event.detail.element));
  }

  async onElementPick(event: CustomEvent<KritzelObjectElementPickEvent>): Promise<void> {
    const { objectId, element } = event.detail;
    this.picked.set(describe(element));
    this.isPicking.set(false);

    const editor = this.editor();
    if (!editor) return;

    try {
      await editor.setObjectElementPicking(objectId, false);
      await editor.highlightObjectElements(objectId, [{ selector: element.selector, label: 'Picked' }]);
      this.agent.setStatus(`Looking at ${element.kritzelId ?? element.tagName}`);
      // An element target: the agent's cursor moves to the element inside the iframe and follows it from then on.
      await this.agent.moveTo({ objectId, selector: element.selector });
    } catch (error) {
      console.warn('Could not point the agent at the picked element.', error);
    }
  }

  async togglePicking(): Promise<void> {
    const editor = this.editor();
    if (!editor) return;

    const enabled = !this.isPicking();
    try {
      await editor.setObjectElementPicking(this.iframeObject.id, enabled);
      this.isPicking.set(enabled);
    } catch (error) {
      console.warn('Could not toggle element picking.', error);
    }
  }

  async highlightButtons(): Promise<void> {
    try {
      await this.editor()?.highlightObjectElements(this.iframeObject.id, [{ selector: 'button' }]);
    } catch (error) {
      console.warn('Could not highlight the buttons.', error);
    }
  }

  async clearHighlights(): Promise<void> {
    try {
      await this.editor()?.clearObjectElementHighlights(this.iframeObject.id);
    } catch (error) {
      console.warn('Could not clear the highlights.', error);
    }
  }

  private createIframeObject(): KritzelIframeObject {
    const iframeObject = new KritzelIframeObject({
      name: 'Team plan',
      title: 'Team plan',
      content: iframeElementsContent,
      translateX: -150,
      translateY: CARD_TOP,
      width: 300,
      height: 290,
      borderRadius: 12,
      boxShadow: '0 12px 32px rgba(32, 33, 36, 0.12)',
    });

    iframeObject.isRotatable = false;
    return iframeObject;
  }
}
