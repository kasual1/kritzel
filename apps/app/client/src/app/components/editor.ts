import { Component, inject, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import {
  ActiveWorkspaceChangeEvent,
  EditorIsReadyEvent,
  HocuspocusSyncProvider,
  HttpAssetProvider,
  IndexedDBAssetProvider,
  IndexedDBSyncProvider,
  KritzelAssetStorageConfig,
  KritzelDynamicObject,
  KritzelEditor,
  KritzelSyncConfig,
  LoginEvent
} from '@kritzel/angular-editor';
import { UserData } from '../resolvers/user.resolver';
import { AuthService } from '../services/auth.service';
import { ConfigService } from '../services/config.service';
import { UsersService } from '../services/users.service';
import { IUser } from '../models/user.model';
import { animateWelcomeObject, createWelcomeObject, getWelcomeBoundsUpdate } from './welcome-object';

@Component({
  selector: 'app-editor',
  imports: [KritzelEditor],
  template: `
      <kritzel-editor
        [user]="user"
        [activeUsers]="activeUsers"
        [syncConfig]="syncConfig"
        [assetStorageConfig]="assetStorageConfig"
        [loginConfig]="loginConfig"
        [activeWorkspaceId]="activeWorkspaceId"
        (isReady)="onIsReady($event)"
        (login)="onLogin($event)"
        (logout)="onLogout()"
        (activeWorkspaceChange)="onActiveWorkspaceChange($event)"
        (awarenessChange)="onAwarenessChange($event)"
      ></kritzel-editor>
  `,
  styles: [`
    :host { display: block; width: 100%; height: 100dvh; }
    kritzel-editor { display: block; width: 100%; height: 100%; }
  `],
})
export class Editor {
  @ViewChild(KritzelEditor) editor!: KritzelEditor;

  private readonly route = inject(ActivatedRoute);
  private readonly auth = inject(AuthService);
  private readonly usersService = inject(UsersService);
  private readonly configService: ConfigService = inject(ConfigService);
  private readonly openedAt = Date.now();
  private readonly animatedWelcomeElements = new WeakSet<HTMLElement>();
  private isEditorReady = false;

  activeWorkspaceId: string | null = null;

  isShared = false;

  user: UserData | null = null;

  activeUsers: IUser[] = [];

  syncConfig!: KritzelSyncConfig;

  assetStorageConfig!: KritzelAssetStorageConfig;

  loginConfig = {
    providers: [
      { name: 'google', label: 'Sign in with Google', icon: 'google' }
    ],
    title: 'Welcome to Kritzel',
  };

  async ngOnInit(): Promise<void> {
    this.user = this.route.snapshot.data['user'] as UserData;

    this.activeWorkspaceId = this.route.snapshot.params['workspaceId'];

    this.isShared = this.route.snapshot.queryParams['share'] === 'true';

    const wsProtocol = location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${wsProtocol}//${location.host}/ws`;

    const hocuspocusOptions: { url: string; token?: () => Promise<string> } = { url: wsUrl };
    if (!this.user.isGuest) {
      hocuspocusOptions.token = () => this.auth.getWsToken();
    }

    // Offline the websocket provider only stalls the editor until its connect timeout expires.
    this.syncConfig = {
      appStateId: this.user.id,
      providers: navigator.onLine
        ? [HocuspocusSyncProvider.with(hocuspocusOptions), IndexedDBSyncProvider]
        : [IndexedDBSyncProvider],
    };

    const assetBaseUrl = await this.configService.getAssetBaseUrl();
    const apiOrigin = window.location.origin;

    this.assetStorageConfig = {
      providers: [
        IndexedDBAssetProvider,
        HttpAssetProvider.with({
          uploadUrl: () => `${apiOrigin}/api/assets`,
          resolveUrl: (id: any) => `${assetBaseUrl}/users/${this.user!.id}/${id}`,
          deleteUrl: (id: any) => `${apiOrigin}/api/assets/${id}`,
        }),
      ],
    };
  }

  async onIsReady(event: CustomEvent<EditorIsReadyEvent>) {
    const editorState = event.detail;
    console.log('Editor is ready with state:', editorState);

    await this.initializeWelcome(editorState);
    this.isEditorReady = true;

    if (this.isShared && this.activeWorkspaceId) {
      await this.editor.loadSharedWorkspace(this.activeWorkspaceId);
      await this.animateWorkspaceWelcome();
      return;
    }

    this.activeWorkspaceId = editorState.activeWorkspace.id;
    window.history.replaceState(null, '', `/${editorState.activeWorkspace.id}`);
    await this.animateWorkspaceWelcome();
  }

  private async initializeWelcome(state: EditorIsReadyEvent): Promise<void> {
    if (!this.user) {
      throw new Error('Cannot initialize the starter workspace without a user.');
    }

    const key = `kritzel_welcome_initialized:${this.user.id}`;
    if (localStorage.getItem(key)) {
      return;
    }

    // Keep this user-level marker even when the object or all workspaces are deleted.
    localStorage.setItem(key, 'true');

    if (this.isShared || this.route.snapshot.params['workspaceId']) {
      return;
    }

    const workspaces = await this.editor.getWorkspaces();
    if (
      workspaces.length !== 1 ||
      workspaces[0].id !== state.activeWorkspace.id ||
      new Date(workspaces[0].createdAt).getTime() < this.openedAt ||
      await this.editor.getObjectsTotalCount() !== 0
    ) {
      return;
    }

    // The engine measures its host once at startup and then only on window resize. Re-measure so
    // a viewport that settled afterwards (e.g. mobile browser chrome) is reflected before centering.
    window.dispatchEvent(new Event('resize'));
    const viewport = await this.editor.getViewport();
    const welcome = createWelcomeObject();
    // An object occupies width / scale world units, so a larger scale makes it smaller on screen.
    welcome.scale = Math.max(
      1,
      welcome.width * viewport.scale / Math.max(viewport.width - 48, 1),
      welcome.height * viewport.scale / Math.max(viewport.height - 48, 1),
    );
    await this.editor.addObject(welcome);
    await this.editor.centerObjectInViewport(welcome);
  }

  private async animateWorkspaceWelcome(): Promise<void> {
    const objects = await this.editor.getAllObjects();
    for (const object of objects) {
      if (object instanceof KritzelDynamicObject) {
        const update = getWelcomeBoundsUpdate(object);
        if (update && !await this.editor.updateObject(object, update)) {
          throw new Error('Cannot update the saved Welcome object bounds.');
        }
      }
      if (
        object.__class__ === 'KritzelDynamicObject' &&
        'element' in object &&
        object.element instanceof HTMLElement &&
        object.element.querySelector('svg[aria-label="Welcome"]') &&
        !this.animatedWelcomeElements.has(object.element)
      ) {
        this.animatedWelcomeElements.add(object.element);
        animateWelcomeObject({ element: object.element });
      }
    }
  }

  async onActiveWorkspaceChange(event: CustomEvent<ActiveWorkspaceChangeEvent>) {
    const workspace = event.detail;
    console.log('Active workspace changed:', workspace);

    this.activeWorkspaceId = workspace.id;
    window.history.replaceState(null, '', `/${workspace.id}`);
    if (this.isEditorReady) {
      await this.animateWorkspaceWelcome();
    }
  }

  onLogin(event: CustomEvent<LoginEvent>) {
    const login = event.detail;

    if (login.provider === 'google') {
      window.location.href = `${window.location.origin}/api/auth/google`;
    }
  }

  async onLogout() {
    await this.auth.logout();
    window.location.assign('/');
  }

  onAwarenessChange(event: CustomEvent<Map<number, Record<string, unknown>>>) {
    const ownId = this.user?.id;
    const userIds = Array.from(event.detail.values())
      .map((state) => state['user'])
      .filter((u): u is Record<string, unknown> => !!u && typeof u === 'object' && 'id' in u)
      .map((u) => u['id'] as string)
      .filter((id) => id !== ownId);

    this.usersService.resolveUsers(userIds, (users) => {
      this.activeUsers = users.map((u) => ({
        id: u.id,
        displayName: u.displayName,
        profileImageUrl: undefined,
      }));
    });
  }
}
