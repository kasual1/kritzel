// TEMP: demo of KritzelChatSession in command mode against a mocked server answered by a real model; delete with pages/temp/.
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { KritzelChatSession, KritzelEditor, KritzelWorkspace } from '@kritzel/angular-editor';
import { angularThemeLight } from '../../const/angular-theme-light';
import { angularThemeDark } from '../../const/angular-theme-dark';
import { llmTransport } from './mock-llm-chat-server';

const SYSTEM = 'You draw on a whiteboard. Look at the canvas before you change it. Keep answers short.';
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
        [isChatBoxVisible]="true"
        [chatSession]="session"
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

  readonly session = new KritzelChatSession({ transport: llmTransport, system: SYSTEM });
}
