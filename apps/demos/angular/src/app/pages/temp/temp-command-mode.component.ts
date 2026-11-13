// TEMP: demo of UpdrawChatSession in command mode against a mocked server answered by a real model; delete with pages/temp/.
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { UPDRAW_DEFAULT_OBJECT_TITLEBAR, UpdrawChatSession, UpdrawEditor, UpdrawIframeObject, UpdrawObjectConfig, UpdrawWorkspace } from '@updraw/angular-editor';
import { angularThemeLight } from '../../const/angular-theme-light';
import { angularThemeDark } from '../../const/angular-theme-dark';
import { llmTransport } from './mock-llm-chat-server';

const SYSTEM = `You draw on a whiteboard. Look at the canvas before you change it.`;
@Component({
  selector: 'app-temp-command-mode',
  imports: [UpdrawEditor],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="editor">
      <updraw-editor
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
      ></updraw-editor>
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
  workspaces = [new UpdrawWorkspace({ viewport: { centerWorldX: 200, centerWorldY: 280, scale: 0.7 } })];
  objectConfig: UpdrawObjectConfig = {
    hasTitlebar: (object) => object instanceof UpdrawIframeObject,
    isRotatable: (object) => object instanceof UpdrawIframeObject === false
  };
  readonly objectTitlebar = UPDRAW_DEFAULT_OBJECT_TITLEBAR;

  readonly session = new UpdrawChatSession({ transport: llmTransport, system: SYSTEM, canvasTools: { iframes: true } });
}
