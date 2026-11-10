// TEMP: demo of KritzelChatSession with a streaming server answered by a real model; delete with pages/temp/.
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { KRITZEL_DEFAULT_OBJECT_TITLEBAR, KritzelChatSession, KritzelEditor, KritzelIframeObject, KritzelObjectConfig, KritzelWorkspace } from '@kritzel/angular-editor';
import { angularThemeLight } from '../../const/angular-theme-light';
import { angularThemeDark } from '../../const/angular-theme-dark';
import { llmStreamTransport } from './mock-llm-stream-chat-server';

const SYSTEM = `You draw on a whiteboard. Look at the canvas before you change it. Build anything interactive or \
data-like, such as a weather card, a timer or a chart, as a widget with create_iframe.`;

/**
 * Like the command-mode demo, but the server streams the model's answer: each tool call runs as soon as the model
 * has written it, and a widget shows as a loading placeholder once its position and size are written, while the
 * model still writes its code.
 */
@Component({
  selector: 'app-temp-streaming',
  imports: [KritzelEditor],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="editor">
      <kritzel-editor
        editorId="temp-streaming"
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
export class TempStreamingComponent {
  themes = [angularThemeLight, angularThemeDark];
  workspaces = [new KritzelWorkspace({ viewport: { centerWorldX: 200, centerWorldY: 280, scale: 0.7 } })];
  objectConfig: KritzelObjectConfig = {
    hasTitlebar: (object) => object instanceof KritzelIframeObject,
    isRotatable: (object) => object instanceof KritzelIframeObject === false,
  };
  readonly objectTitlebar = KRITZEL_DEFAULT_OBJECT_TITLEBAR;

  readonly session = new KritzelChatSession({ transport: llmStreamTransport, system: SYSTEM, canvasTools: { iframes: true } });
}
