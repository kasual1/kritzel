// TEMP: demo of UpmadeChatSession in agent mode with a streaming server answered by a real model; delete with pages/temp/.
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { IndexedDBSyncProvider, UPMADE_DEFAULT_OBJECT_TITLEBAR, UpmadeAgent, UpmadeChatSession, UpmadeEditor, UpmadeIframeObject, UpmadeObjectConfig, UpmadeSyncConfig, UpmadeWorkspace } from '@upmade/angular-editor';
import { angularThemeLight } from '../../const/angular-theme-light';
import { angularThemeDark } from '../../const/angular-theme-dark';
import { llmStreamTransport } from './mock-llm-stream-chat-server';

const SYSTEM = `You draw on a whiteboard. Look at the canvas before you change it. Build anything interactive or \
data-like, such as a weather card, a timer or a chart, as a widget with create_iframe.`;

/**
 * Like the streaming demo, but in agent mode: the model works as "Assistant", with its own cursor, selection and
 * history. Each tool call runs as soon as the model has written it, and a widget shows as a loading placeholder
 * (placed by the agent's cursor) once its position and size are written, while the model still writes its code.
 */
@Component({
  selector: 'app-temp-agent-streaming',
  imports: [UpmadeEditor],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="editor">
      <upmade-editor
        editorId="temp-agent-streaming"
        [theme]="'light'"
        [themes]="themes"
        [workspaces]="workspaces"
        [syncConfig]="syncConfig"
        [objectConfig]="objectConfig"
        [objectTitlebar]="objectTitlebar"
        [chatSession]="session"
        [isChatBoxVisible]="true"
        [isMoreMenuVisible]="false"
        [isWorkspaceManagerVisible]="false"
        [isZoomPanelVisible]="false"
      ></upmade-editor>
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
export class TempAgentStreamingComponent {
  themes = [angularThemeLight, angularThemeDark];
  workspaces = [new UpmadeWorkspace({ id: 'temp-agent-streaming', viewport: { centerWorldX: 200, centerWorldY: 280, scale: 0.7 } })];
  syncConfig: UpmadeSyncConfig = {
    providers: [IndexedDBSyncProvider]
  };
  objectConfig: UpmadeObjectConfig = {
    hasTitlebar: (object) => object instanceof UpmadeIframeObject,
    isRotatable: (object) => object instanceof UpmadeIframeObject === false,
  };
  readonly objectTitlebar = UPMADE_DEFAULT_OBJECT_TITLEBAR;

  readonly session = new UpmadeChatSession({
    transport: llmStreamTransport,
    system: SYSTEM,
    canvasTools: { iframes: true },
    agent: new UpmadeAgent({ id: 'assistant', name: 'Assistant', color: '#7C3AED' }),
  });
}
