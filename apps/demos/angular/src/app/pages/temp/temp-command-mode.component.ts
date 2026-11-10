// TEMP: demo of KritzelChatSession in command mode against a mocked server answered by a real model; delete with pages/temp/.
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { KRITZEL_DEFAULT_OBJECT_TITLEBAR, KritzelChatSession, KritzelEditor, KritzelIframeObject, KritzelObjectConfig, KritzelWorkspace } from '@kritzel/angular-editor';
import { angularThemeLight } from '../../const/angular-theme-light';
import { angularThemeDark } from '../../const/angular-theme-dark';
import { llmTransport } from './mock-llm-chat-server';

const SYSTEM = `You draw on a whiteboard. Look at the canvas before you change it.`;
@Component({
  selector: 'app-temp-command-mode',
  imports: [KritzelEditor],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="editor">
      <kritzel-editor
        editorId="temp-command-mode"
        [theme]="'light'"
        [themes]="themes"
        [workspaces]="workspaces"
        [objectConfig]="objectConfig"
        [objectTitlebar]="objectTitlebar"
        [chatSession]="session"
        [isChatBoxVisible]="true"
        [isMoreMenuVisible]="false"
        [isWorkspaceManagerVisible]="false"
      ></kritzel-editor>
    </div>
  `,
  styles: [
    `
      :host {
        display: flex;
        flex-direction: column;
        height: 100%;
        font-family: Roboto, sans-serif;
      }
      .editor {
        flex: 1;
        min-height: 0;
        position: relative;
      }
    `,
  ],
})
export class TempCommandModeComponent {
  themes = [angularThemeLight, angularThemeDark];
  workspaces = [new KritzelWorkspace({ viewport: { centerWorldX: 200, centerWorldY: 280, scale: 0.7 } })];
  objectConfig: KritzelObjectConfig = {
    hasTitlebar: (object) => object instanceof KritzelIframeObject,
    isRotatable: (object) => object instanceof KritzelIframeObject === false
  };
  readonly objectTitlebar = KRITZEL_DEFAULT_OBJECT_TITLEBAR;

  readonly session = new KritzelChatSession({ transport: llmTransport, system: SYSTEM, canvasTools: { iframes: true } });
}
