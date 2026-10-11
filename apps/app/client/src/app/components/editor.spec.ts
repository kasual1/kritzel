import { TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import {
  EditorIsReadyEvent,
  KritzelDynamicObject,
  KritzelEditor,
  KritzelWorkspace,
} from '@kritzel/angular-editor';
import { vi } from 'vitest';
import { AuthService } from '../services/auth.service';
import { ConfigService } from '../services/config.service';
import { UsersService } from '../services/users.service';
import { Editor } from './editor';
import { animateWelcomeObject, createWelcomeObject, getWelcomeBoundsUpdate } from './welcome-object';

describe('Starter workspace', () => {
  const user = { id: 'starter-test-user', displayName: 'Guest', isGuest: true };
  const key = `kritzel_welcome_initialized:${user.id}`;
  let component: Editor;
  let workspace: KritzelWorkspace;
  let params: Record<string, string>;
  let objects: KritzelDynamicObject[];

  beforeEach(() => {
    vi.stubGlobal('matchMedia', vi.fn(() => ({ matches: true })));
    localStorage.removeItem(key);
    params = {};
    objects = [];
    TestBed.configureTestingModule({
      imports: [KritzelEditor],
      providers: [
        { provide: ActivatedRoute, useValue: { snapshot: { params } } },
        { provide: AuthService, useValue: {} },
        { provide: ConfigService, useValue: {} },
        { provide: UsersService, useValue: {} },
      ],
    });
    component = TestBed.runInInjectionContext(() => new Editor());
    component.user = user;
    workspace = new KritzelWorkspace();
    component.editor = TestBed.createComponent(KritzelEditor).componentInstance;
    vi.spyOn(component.editor, 'getWorkspaces').mockImplementation(async () => [workspace]);
    vi.spyOn(component.editor, 'getObjectsTotalCount').mockImplementation(async () => objects.length);
    vi.spyOn(component.editor, 'getAllObjects').mockImplementation(async () => objects);
    vi.spyOn(component.editor, 'getViewport').mockResolvedValue({
      width: 360, height: 640, scale: 1, translateX: 0, translateY: 0,
    });
    vi.spyOn(component.editor, 'addObject').mockImplementation(async (object) => {
      if (!(object instanceof KritzelDynamicObject)) {
        throw new Error('Expected a dynamic Welcome object.');
      }
      objects.push(object);
      return object;
    });
    vi.spyOn(component.editor, 'centerObjectInViewport').mockImplementation(async (object) => object);
    vi.spyOn(component.editor, 'updateObject').mockImplementation(async (object, update) => {
      Object.assign(object, update);
      return object;
    });
    vi.spyOn(component.editor, 'loadSharedWorkspace').mockResolvedValue(undefined);
    vi.spyOn(window.history, 'replaceState').mockImplementation(() => {});
    vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    localStorage.removeItem(key);
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  function readyEvent(): CustomEvent<EditorIsReadyEvent> {
    return new CustomEvent<EditorIsReadyEvent>('isReady', {
      detail: {
        host: document.createElement('div'),
        activeWorkspace: workspace,
        syncConfig: { appStateId: user.id, providers: [] },
        loginConfig: component.loginConfig,
        theme: 'light',
      },
    });
  }

  function ready(): Promise<void> {
    return component.onIsReady(readyEvent());
  }

  it('adds and centers a blue SVG path only on first initialization', async () => {
    await ready();
    expect(objects).toHaveLength(1);
    expect(objects[0]).toBeInstanceOf(KritzelDynamicObject);
    expect(component.editor.centerObjectInViewport).toHaveBeenCalledWith(objects[0]);
    const svg = objects[0].element.querySelector('svg');
    expect(svg?.getAttribute('aria-label')).toBe('Welcome');
    expect(svg?.querySelector('text')).toBeNull();
    expect(svg?.querySelector('path')?.getAttribute('stroke')).toBe('#4A7DFF');
    expect(localStorage.getItem(key)).toBe('true');
  });

  it.each([
    { width: 360, height: 640, zoom: 1, scale: 480 / (360 - 48) },
    { width: 390, height: 664, zoom: 1, scale: 480 / (390 - 48) },
    { width: 800, height: 120, zoom: 1, scale: (480 * 72 / 253) / (120 - 48) },
    { width: 1920, height: 1080, zoom: 1, scale: 1 },
    { width: 390, height: 664, zoom: 2, scale: 2 * 480 / (390 - 48) },
  ])('fits the Welcome object on screen in a $width x $height viewport at zoom $zoom', async (size) => {
    vi.mocked(component.editor.getViewport).mockResolvedValue({
      width: size.width, height: size.height, scale: size.zoom, translateX: 0, translateY: 0,
    });

    await ready();

    // An object occupies width / scale world units, so it is shown at width / scale * zoom pixels.
    const scale = objects[0].scale ?? 1;
    expect(scale).toBeCloseTo(size.scale);
    expect(objects[0].width / scale * size.zoom).toBeLessThanOrEqual(size.width - 48 + 1e-6);
    expect(objects[0].height / scale * size.zoom).toBeLessThanOrEqual(size.height - 48 + 1e-6);
    expect(component.editor.centerObjectInViewport).toHaveBeenCalledExactlyOnceWith(objects[0]);
  });

  it('re-measures the viewport before sizing and centering the Welcome object', async () => {
    const order: string[] = [];
    const onResize = () => order.push('resize');
    window.addEventListener('resize', onResize);
    vi.mocked(component.editor.getViewport).mockImplementation(async () => {
      order.push('getViewport');
      return { width: 390, height: 664, scale: 1, translateX: 0, translateY: 0 };
    });
    vi.mocked(component.editor.centerObjectInViewport).mockImplementation(async (object) => {
      order.push('center');
      return object;
    });

    try {
      await ready();
    } finally {
      window.removeEventListener('resize', onResize);
    }

    expect(order).toEqual(['resize', 'getViewport', 'center']);
  });

  it('does not restore Welcome after deletion, reload, or switching to an empty workspace', async () => {
    await ready();
    objects = [];
    workspace = new KritzelWorkspace();
    await ready();
    expect(objects).toHaveLength(0);
    expect(component.editor.addObject).toHaveBeenCalledTimes(1);

    const reloaded = TestBed.runInInjectionContext(() => new Editor());
    reloaded.user = user;
    reloaded.editor = component.editor;
    await reloaded.onIsReady(readyEvent());
    expect(objects).toHaveLength(0);
  });

  it('leaves a previously used empty workspace unchanged', async () => {
    workspace.createdAt = new Date(0);
    await ready();
    expect(objects).toHaveLength(0);
    expect(localStorage.getItem(key)).toBe('true');
  });

  it('leaves existing content unchanged', async () => {
    objects.push(createWelcomeObject());
    await ready();
    expect(component.editor.addObject).not.toHaveBeenCalled();
  });

  it('does not seed when the user already has multiple workspaces', async () => {
    vi.mocked(component.editor.getWorkspaces).mockResolvedValue([workspace, new KritzelWorkspace()]);
    await ready();
    expect(objects).toHaveLength(0);
  });

  it('does not seed shared links', async () => {
    component.isShared = true;
    component.activeWorkspaceId = 'shared-board';
    await ready();
    expect(component.editor.loadSharedWorkspace).toHaveBeenCalledWith('shared-board');
    expect(component.editor.getWorkspaces).not.toHaveBeenCalled();
    expect(objects).toHaveLength(0);
  });

  it('does not seed workspace deep links', async () => {
    params['workspaceId'] = workspace.id;
    await ready();
    expect(objects).toHaveLength(0);
  });

  it('serializes the SVG for persistence without requiring a renderer', () => {
    const welcome = createWelcomeObject();
    const serialized = welcome.serialize();
    const restored = new KritzelDynamicObject({}).deserialize<KritzelDynamicObject>(serialized);
    expect(restored.element.querySelector('path')?.getAttribute('stroke')).toBe('#4A7DFF');
    expect(restored.width).toBe(480);
    expect(restored.height).toBeCloseTo(480 * 72 / 253);
  });

  it('crops a saved Welcome once without moving or enlarging its lettering', async () => {
    localStorage.setItem(key, 'true');
    const welcome = createWelcomeObject();
    welcome.element.querySelector('svg')!.setAttribute('viewBox', '0 0 280 120');
    welcome.height = 206;
    welcome.translateX = 100;
    welcome.translateY = 200;
    objects.push(welcome);

    await ready();
    await ready();

    expect(component.editor.updateObject).toHaveBeenCalledTimes(1);
    expect(component.editor.addObject).not.toHaveBeenCalled();
    expect(welcome.element.querySelector('svg')?.getAttribute('viewBox')).toBe('18 29 253 72');
    expect(welcome.width).toBeCloseTo(480 / 280 * 253);
    expect(welcome.height).toBeCloseTo(480 / 280 * 72);
    expect(welcome.translateX).toBeCloseTo(100 + 18 * 480 / 280);
    expect(welcome.translateY).toBeCloseTo(200 + (206 - 120 * 480 / 280) / 2 + 29 * 480 / 280);
    expect(getWelcomeBoundsUpdate(welcome)).toBeNull();
    const restored = new KritzelDynamicObject({}).deserialize<KritzelDynamicObject>(welcome.serialize());
    expect(restored.width).toBeCloseTo(welcome.width);
    expect(restored.element.querySelector('svg')?.getAttribute('viewBox')).toBe('18 29 253 72');
  });

  it('preserves a scaled and rotated saved drawing when cropping', () => {
    const welcome = createWelcomeObject();
    welcome.element.querySelector('svg')!.setAttribute('viewBox', '0 0 280 120');
    welcome.height = 206;
    welcome.scale = 2;
    welcome.rotation = Math.PI / 2;
    const update = getWelcomeBoundsUpdate(welcome)!;
    const ratio = 480 / 280;
    const dx = (18 + 253 / 2 - 140) * ratio / 2;
    const dy = (29 + 72 / 2 - 60) * ratio / 2;
    expect(update.translateX).toBeCloseTo((480 - update.width!) / 4 - dy);
    expect(update.translateY).toBeCloseTo((206 - update.height!) / 4 + dx);
    expect(welcome.element.querySelector('svg')?.getAttribute('viewBox')).toBe('0 0 280 120');
  });

  it('does not crop unrelated SVG drawings with the same label', () => {
    const welcome = createWelcomeObject();
    welcome.element.querySelector('svg')!.setAttribute('viewBox', '0 0 280 120');
    welcome.element.querySelector('path')!.setAttribute('d', 'M 0 0 L 100 100');
    expect(getWelcomeBoundsUpdate(welcome)).toBeNull();
  });

  it('preserves the supplied lettering as two pen strokes without an underline', () => {
    const svg = createWelcomeObject().element.querySelector('svg');
    expect(svg?.getAttribute('viewBox')).toBe('18 29 253 72');
    const paths = svg!.querySelectorAll('path');
    expect(paths).toHaveLength(2);
    expect(paths[0].getAttribute('d')).toMatch(/83,34$/);
    const data = paths[1].getAttribute('d')!;
    expect(data.trim()).toMatch(/269,90$/);
    expect(paths[0].getAttribute('stroke')).toBe('#4A7DFF');
    expect(paths[0].getAttribute('stroke-width')).toBe('4');
  });

  it('draws strokes sequentially at equal speed without persisting animation state', () => {
    vi.stubGlobal('matchMedia', vi.fn(() => ({ matches: false })));
    const welcome = createWelcomeObject();
    const paths = welcome.element.querySelectorAll('path');
    const animations = [vi.fn(), vi.fn()];
    paths.forEach((path, index) => {
      Object.defineProperty(path, 'getTotalLength', { value: () => index === 0 ? 100 : 300 });
      Object.defineProperty(path, 'animate', { value: animations[index] });
    });
    const html = welcome.serialize().htmlString;
    animateWelcomeObject(welcome);
    expect(animations[0]).toHaveBeenCalledWith(expect.arrayContaining([
      expect.objectContaining({ strokeDashoffset: 100 }),
      expect.objectContaining({ strokeDashoffset: 0 }),
    ]), { duration: 337.5, delay: 100, easing: 'linear', fill: 'backwards' });
    expect(animations[1]).toHaveBeenCalledWith(expect.any(Array), {
      duration: 1012.5, delay: 487.5, easing: 'linear', fill: 'backwards',
    });
    expect(welcome.serialize().htmlString).toBe(html);
  });

  it('shows the completed drawing immediately when reduced motion is requested', () => {
    const welcome = createWelcomeObject();
    const animate = vi.fn();
    welcome.element.querySelectorAll('path').forEach(path => {
      Object.defineProperty(path, 'animate', { value: animate });
    });
    animateWelcomeObject(welcome);
    expect(animate).not.toHaveBeenCalled();
  });

  it('animates an existing Welcome on load without inserting or replaying it twice', async () => {
    vi.stubGlobal('matchMedia', vi.fn(() => ({ matches: false })));
    localStorage.setItem(key, 'true');
    const welcome = createWelcomeObject();
    const animate = vi.fn();
    welcome.element.querySelectorAll('path').forEach(path => {
      Object.defineProperty(path, 'getTotalLength', { value: () => 100 });
      Object.defineProperty(path, 'animate', { value: animate });
    });
    objects.push(welcome);
    await ready();
    await ready();
    expect(animate).toHaveBeenCalledTimes(2);
    expect(component.editor.addObject).not.toHaveBeenCalled();
  });
});
