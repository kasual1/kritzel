import {
  ChangeDetectionStrategy,
  Component,
  computed,
  signal,
  ViewChild,
  ElementRef,
  OnDestroy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  EditorIsReadyEvent,
  KritzelBaseObject,
  KritzelEditor,
  KritzelSyncConfig,
  ShapeType,
  ObjectsAddedEvent,
  ObjectsRemovedEvent,
  ObjectsUpdatedEvent,
} from 'kritzel-angular';
import { angularThemeLight } from '../../const/angular-theme-light';
import { angularThemeDark } from '../../const/angular-theme-dark';
import { createSeedObjects } from '../../const/seed-objects';

@Component({
  selector: 'app-object-explorer',
  imports: [CommonModule, KritzelEditor],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="content-shell">
      <div class="editor-container">
        <kritzel-editor
          editorId="object-explorer"
          [theme]="'angular-theme'"
          [themes]="themes"
          [syncConfig]="syncConfig"
          [isMoreMenuVisible]="false"
          [isWorkspaceManagerVisible]="false"
          [wheelEnabled]="false"
          (isReady)="onIsReady($event)"
          (objectsAdded)="onObjectsAdded($event)"
          (objectsRemoved)="onObjectsRemoved($event)"
          (objectsUpdated)="onObjectsUpdated($event)"
        ></kritzel-editor>
      </div>

      <aside>
        <div class="panel-header">
          <span class="panel-tagline">Explorer Mode</span>
          <h2 class="panel-title">Hierarchical Object Explorer</h2>
        </div>

        <section class="section">
          <h4>Filters</h4>
          <input
            type="text"
            [value]="searchQuery()"
            (input)="onSearchInput($event)"
            placeholder="Search text, ID, or type..."
            class="search-input"
          />

          <div class="filter-header">Types</div>
          <div class="type-filters">
            @for (type of availableTypes; track type) {
              <button
                [class.active]="selectedTypes().has(type)"
                (click)="toggleTypeFilter(type)"
                class="filter-chip"
              >
                {{ type.replace('Kritzel', '') }}
              </button>
            }
          </div>
        </section>

        <section class="section">
          <h4>Canvas Hierarchy ({{ visibleRootsCount() }} roots)</h4>
          <div class="tree-container">
            @if (rootObjects().length === 0) {
              <div class="empty-msg">No objects on canvas</div>
            } @else {
              @for (root of rootObjects(); track root.id) {
                <ng-container
                  *ngTemplateOutlet="nodeTemplate; context: { obj: root, depth: 0 }"
                ></ng-container>
              }
            }
          </div>
        </section>

        <ng-template #nodeTemplate let-obj="obj" let-depth="depth">
          @if (isNodeVisible(obj)) {
            <div
              class="tree-node"
              [style.padding-left.px]="depth * 16"
              [class.selected]="selectedObject()?.id === obj.id"
              [class.hidden-obj]="!obj.isVisible"
            >
              <span class="node-arrow" (click)="toggleExpand($event, obj)">
                @if (obj.__class__ === 'KritzelGroup') {
                  {{ isExpanded(obj.id) ? '▼' : '▶' }}
                } @else {
                  •
                }
              </span>

              <div class="node-content" (click)="selectTreeObject(obj)">
                <span class="node-text">{{ getDisplayName(obj) }}</span>
                <span class="node-id">{{ obj.id.slice(0, 4) }}</span>
              </div>

              <div class="node-actions">
                <button
                  class="node-action delete"
                  (click)="deleteTreeObject($event, obj)"
                  title="Delete Object"
                >
                  Delete
                </button>
              </div>
            </div>

            @if (obj.__class__ === 'KritzelGroup' && isExpanded(obj.id)) {
              @for (child of getGroupChildren(obj); track child.id) {
                <ng-container
                  *ngTemplateOutlet="nodeTemplate; context: { obj: child, depth: depth + 1 }"
                ></ng-container>
              }
            }
          }
        </ng-template>

        @if (selectedObject(); as selObj) {
          <section class="section inspector">
            <h4>Inspector: {{ selObj.__class__.replace('Kritzel', '') }}</h4>

            <div class="inspector-field">
              <label>ID</label>
              <input type="text" [value]="selObj.id" disabled class="input-disabled" />
            </div>

            <div class="inspector-field">
              <label>Position X / Y</label>
              <div class="coords-row">
                <input
                  type="number"
                  [value]="selObj.translateX"
                  (change)="updateSelectedProperty('translateX', $event)"
                />
                <input
                  type="number"
                  [value]="selObj.translateY"
                  (change)="updateSelectedProperty('translateY', $event)"
                />
              </div>
            </div>

            @if (selObj.__class__ === 'KritzelText') {
              <div class="inspector-field">
                <label>Text Content</label>
                <input
                  type="text"
                  [value]="getTextContent(selObj)"
                  (change)="updateSelectedProperty('text', $event)"
                />
              </div>
            }

            @if (selObj.__class__ === 'KritzelShape') {
              <div class="inspector-field">
                <label>Size W / H</label>
                <div class="coords-row">
                  <input
                    type="number"
                    [value]="selObj.width"
                    (change)="updateSelectedProperty('width', $event)"
                  />
                  <input
                    type="number"
                    [value]="selObj.height"
                    (change)="updateSelectedProperty('height', $event)"
                  />
                </div>
              </div>

              <div class="inspector-field">
                <label>Fill Color</label>
                <input
                  type="color"
                  [value]="getShapeFillColor(selObj)"
                  (change)="updateSelectedProperty('fillColor', $event)"
                />
              </div>
            }

            @if (selObj.__class__ === 'KritzelPath') {
              <div class="inspector-field">
                <label>Fill Color</label>
                <input
                  type="color"
                  [value]="getPathFillColor(selObj)"
                  (change)="updateSelectedProperty('fill', $event)"
                />
              </div>

              <div class="inspector-field">
                <label>Stroke Color</label>
                <input
                  type="color"
                  [value]="getPathStrokeColor(selObj)"
                  (change)="updateSelectedProperty('stroke', $event)"
                />
              </div>
            }

            <div class="inspector-field">
              <label>Opacity ({{ getOpacityPercent(selObj) }}%)</label>
              <input
                type="range"
                min="0.1"
                max="1"
                step="0.1"
                [value]="selObj.opacity"
                (input)="updateSelectedProperty('opacity', $event)"
              />
            </div>
          </section>
        }
      </aside>
    </div>
  `,
  styles: `
    :host {
      display: flex;
      flex-direction: column;
      height: 100%;
      font-family: Roboto, sans-serif;
      background-color: #fafafa;
      color: #333333;
    }

    .content-shell {
      display: flex;
      flex: 1;
      min-height: 0;
    }

    .editor-container {
      flex: 1;
      min-width: 0;
    }

    kritzel-editor {
      display: block;
      width: 100%;
      height: 100%;
    }

    aside {
      width: 340px;
      overflow-y: auto;
      border-left: 1px solid #ebebeb;
      background-color: #ffffff;
      padding: 12px;
      font-size: 13px;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .panel-header {
      border-bottom: 1px solid #ebebeb;
      padding-bottom: 10px;
    }

    .panel-tagline {
      display: inline-block;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      background-color: rgba(221, 0, 48, 0.1);
      color: #dd0031;
      padding: 2px 8px;
      border-radius: 99px;
      letter-spacing: 0.5px;
      margin-bottom: 6px;
    }

    .panel-title {
      margin: 0;
      color: #dd0031;
      font-size: 18px;
      line-height: 1.2;
    }

    h4 {
      margin: 0 0 8px 0;
      font-size: 12px;
      color: #777777;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .section {
      border-bottom: 1px solid #eee;
      padding-bottom: 10px;
    }

    .section:last-child {
      border-bottom: none;
      padding-bottom: 0;
    }

    button {
      background: #ffffff;
      border: none;
      border-radius: 6px;
      padding: 6px 10px;
      cursor: pointer;
      font-size: 12px;
      font-family: inherit;
      color: #333333;
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
      transition: all 0.2s ease;
    }

    button:hover {
      background: #dd0031;
      color: #ffffff;
    }

    button.active {
      background: #dd0031;
      color: #ffffff;
    }

    .search-input {
      width: 100%;
      box-sizing: border-box;
      padding: 6px 8px;
      border: 1px solid #ebebeb;
      border-radius: 4px;
      margin-bottom: 10px;
      font-size: 12px;
    }

    .search-input:focus {
      outline: none;
      border-color: #dd0031;
    }

    .filter-header {
      font-size: 11px;
      color: #999999;
      margin: 6px 0 4px 0;
      text-transform: uppercase;
      letter-spacing: 0.2px;
    }

    .type-filters {
      display: flex;
      flex-wrap: wrap;
      gap: 4px;
      margin-bottom: 4px;
    }

    .filter-chip {
      padding: 4px 8px;
      font-size: 11px;
      border-radius: 12px;
      box-shadow: none;
      border: 1px solid #ebebeb;
      background: #f0f0f0;
    }

    .tree-container {
      max-height: 320px;
      overflow-y: auto;
      border: 1px solid #ebebeb;
      border-radius: 4px;
      background: #fafafa;
      padding: 4px;
    }

    .empty-msg {
      padding: 12px;
      text-align: center;
      color: #999999;
    }

    .tree-node {
      display: flex;
      align-items: center;
      padding: 4px 6px;
      border-radius: 4px;
      margin-bottom: 1px;
      transition: background 0.15s;
    }

    .tree-node:hover {
      background: #f0f0f0;
    }

    .tree-node.selected {
      background: #ffebee;
      border-left: 3px solid #dd0031;
    }

    .tree-node.hidden-obj {
      opacity: 0.6;
    }

    .node-arrow {
      width: 16px;
      text-align: center;
      font-size: 10px;
      color: #666666;
      cursor: pointer;
      user-select: none;
      flex-shrink: 0;
    }

    .node-content {
      flex: 1;
      display: flex;
      align-items: center;
      gap: 6px;
      cursor: pointer;
      min-width: 0;
    }

    .node-text {
      font-weight: 500;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      flex-shrink: 1;
    }

    .node-id {
      color: #999999;
      font-size: 10px;
      flex-shrink: 0;
    }

    .node-actions {
      display: flex;
      gap: 2px;
      opacity: 0;
      transition: opacity 0.2s;
    }

    .tree-node:hover .node-actions,
    .tree-node.selected .node-actions {
      opacity: 1;
    }

    .node-action {
      background: transparent;
      border: none;
      padding: 2px 4px;
      border-radius: 3px;
      font-size: 10px;
      color: #666666;
      box-shadow: none;
    }

    .node-action:hover {
      background: #dd0031;
      color: #ffffff;
    }

    .node-action.delete:hover {
      background: #ffebee;
      color: #dd0031;
    }

    .inspector {
      background: #fafafa;
      padding: 10px;
      border-radius: 4px;
      border: 1px solid #ebebeb;
    }

    .inspector-field {
      display: flex;
      flex-direction: column;
      gap: 4px;
      margin-bottom: 8px;
    }

    .inspector-field label {
      font-weight: 600;
      color: #555555;
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.2px;
    }

    .inspector-field input[type='text'],
    .inspector-field input[type='number'],
    .inspector-field input[type='color'] {
      padding: 4px 6px;
      border: 1px solid #ddd;
      border-radius: 3px;
      font-size: 12px;
      font-family: inherit;
      color: #333333;
      background: #ffffff;
    }

    .inspector-field input:focus {
      outline: none;
      border-color: #dd0031;
    }

    .inspector-field input[type='range'] {
      -webkit-appearance: none;
      appearance: none;
      width: 100%;
      height: 6px;
      border-radius: 999px;
      border: none;
      background: linear-gradient(90deg, #dd0031, #b30027);
      accent-color: #dd0031;
      cursor: pointer;
    }

    .inspector-field input[type='range']::-webkit-slider-thumb {
      -webkit-appearance: none;
      appearance: none;
      width: 14px;
      height: 14px;
      border-radius: 50%;
      border: 2px solid #ffffff;
      background: #dd0031;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.25);
      transition: transform 0.15s ease;
    }

    .inspector-field input[type='range']::-webkit-slider-thumb:hover {
      transform: scale(1.08);
    }

    .inspector-field input[type='range']::-moz-range-track {
      height: 6px;
      border: none;
      border-radius: 999px;
      background: linear-gradient(90deg, #dd0031, #b30027);
    }

    .inspector-field input[type='range']::-moz-range-thumb {
      width: 14px;
      height: 14px;
      border-radius: 50%;
      border: 2px solid #ffffff;
      background: #dd0031;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.25);
      cursor: pointer;
    }

    .input-disabled {
      background: #eee;
      color: #777;
    }

    .coords-row {
      display: flex;
      gap: 4px;
    }

    .coords-row input {
      flex: 1;
      width: 50%;
    }


  `,
})
export class ObjectExplorerComponent implements OnDestroy {
  @ViewChild(KritzelEditor) editor!: KritzelEditor;
  @ViewChild(KritzelEditor, { read: ElementRef }) editorHostRef!: ElementRef<HTMLElement>;

  themes = [angularThemeLight, angularThemeDark];

  syncConfig: KritzelSyncConfig = {
    providers: [],
  };

  allObjects = signal<KritzelBaseObject[]>([]);
  expandedGroups = signal<Set<string>>(new Set<string>());
  selectedObject = signal<KritzelBaseObject | null>(null);

  searchQuery = signal<string>('');
  availableTypes = ['KritzelShape', 'KritzelText', 'KritzelLine', 'KritzelPath'];
  selectedTypes = signal<Set<string>>(new Set([...this.availableTypes, 'KritzelGroup']));

  private selectionListenerAttached = false;
  private readonly handleSelectionChangeBound = () => {
    void this.syncInspectorWithSelection();
  };

  childIds = computed(() => {
    const ids = new Set<string>();
    this.allObjects().forEach((obj) => {
      if (obj.__class__ === 'KritzelGroup') {
        const group = obj as any;
        if (group.childIds) {
          group.childIds.forEach((id: string) => ids.add(id));
        }
      }
    });
    return ids;
  });

  rootObjects = computed(() => {
    const all = this.allObjects();
    const children = this.childIds();
    return all.filter((obj) => !children.has(obj.id));
  });

  visibleRootsCount = computed(() => {
    return this.rootObjects().filter((root) => this.isNodeVisible(root)).length;
  });

  async onIsReady(_event: CustomEvent<EditorIsReadyEvent>) {
    const existing = await this.editor.getAllObjects();
    if (existing.length === 0) {
      await this.seedObjects();
    }
    const all = await this.editor.getAllObjects();
    this.allObjects.set([...all]);
    await this.applyTypeOpacityFilter();

    if (!this.selectionListenerAttached) {
      this.editorHostRef.nativeElement.addEventListener(
        'objectsSelectionChange',
        this.handleSelectionChangeBound
      );
      this.selectionListenerAttached = true;
    }

    await this.syncInspectorWithSelection();
  }

  ngOnDestroy() {
    if (this.selectionListenerAttached) {
      this.editorHostRef.nativeElement.removeEventListener(
        'objectsSelectionChange',
        this.handleSelectionChangeBound
      );
      this.selectionListenerAttached = false;
    }
  }

  async onObjectsAdded(event: CustomEvent<ObjectsAddedEvent>) {
    this.allObjects.update((prev) => [...prev, ...event.detail.objects]);
    await this.applyTypeOpacityFilter();
  }

  onObjectsRemoved(event: CustomEvent<ObjectsRemovedEvent>) {
    const removedIds = new Set(event.detail.objects.map((o) => o.id));
    this.allObjects.update((prev) => prev.filter((o) => !removedIds.has(o.id)));

    const active = this.selectedObject();
    if (active && removedIds.has(active.id)) {
      this.selectedObject.set(null);
    }
  }

  onObjectsUpdated(event: CustomEvent<ObjectsUpdatedEvent>) {
    const updatedMap = new Map(event.detail.objects.map((o) => [o.object.id, o.object]));
    this.allObjects.update((prev) => prev.map((o) => updatedMap.get(o.id) || o));

    const active = this.selectedObject();
    if (active && updatedMap.has(active.id)) {
      this.selectedObject.set(updatedMap.get(active.id)!);
    }
  }

  onSearchInput(event: Event) {
    const val = (event.target as HTMLInputElement).value;
    this.searchQuery.set(val);
  }

  async toggleTypeFilter(type: string) {
    this.selectedTypes.update((types) => {
      const next = new Set(types);
      if (next.has(type)) {
        next.delete(type);
      } else {
        next.add(type);
      }
      return next;
    });

    await this.applyTypeOpacityFilter();
  }

  isExpanded(groupId: string): boolean {
    return this.expandedGroups().has(groupId);
  }

  toggleExpand(event: Event, obj: KritzelBaseObject) {
    event.stopPropagation();
    if (obj.__class__ !== 'KritzelGroup') {
      return;
    }
    this.expandedGroups.update((groups) => {
      const next = new Set(groups);
      if (next.has(obj.id)) {
        next.delete(obj.id);
      } else {
        next.add(obj.id);
      }
      return next;
    });
  }

  getGroupChildren(groupObj: KritzelBaseObject): KritzelBaseObject[] {
    const group = groupObj as any;
    if (!group.childIds) {
      return [];
    }
    return this.allObjects().filter((o) => group.childIds.includes(o.id));
  }

  isNodeVisible(obj: KritzelBaseObject): boolean {
    return this.matchesFilter(obj) || (obj.__class__ === 'KritzelGroup' && this.hasMatchingDescendant(obj));
  }

  matchesFilter(obj: KritzelBaseObject): boolean {
    const types = this.selectedTypes();
    if (!types.has(obj.__class__)) {
      return false;
    }

    const query = this.searchQuery().toLowerCase().trim();
    if (!query) {
      return true;
    }

    if (obj.id.toLowerCase().includes(query)) {
      return true;
    }
    if (obj.__class__.toLowerCase().includes(query)) {
      return true;
    }

    if (obj.__class__ === 'KritzelText') {
      const txt = (obj as any).text || '';
      if (txt.toLowerCase().includes(query)) {
        return true;
      }
    }

    if (obj.__class__ === 'KritzelShape') {
      const shapeType = (obj as any).shapeType || '';
      if (shapeType.toLowerCase().includes(query)) {
        return true;
      }
    }

    return false;
  }

  hasMatchingDescendant(groupObj: KritzelBaseObject): boolean {
    const children = this.getGroupChildren(groupObj);
    for (const child of children) {
      if (this.matchesFilter(child)) {
        return true;
      }
      if (child.__class__ === 'KritzelGroup' && this.hasMatchingDescendant(child)) {
        return true;
      }
    }
    return false;
  }

  getDisplayName(obj: KritzelBaseObject): string {
    switch (obj.__class__) {
      case 'KritzelGroup': {
        const count = (obj as any).childIds?.length ?? 0;
        return `Group (${count} items)`;
      }
      case 'KritzelShape': {
        const shape = obj as any;
        return shape.shapeType === ShapeType.Ellipse ? 'Ellipse' : 'Rectangle';
      }
      case 'KritzelText': {
        const txt = (obj as any).text || 'Blank Text';
        return `Text "${txt.length > 15 ? `${txt.slice(0, 15)}...` : txt}"`;
      }
      case 'KritzelLine':
        return 'Line';
      case 'KritzelPath':
        return 'Brush Path';
      default:
        return obj.__class__.replace('Kritzel', '');
    }
  }

  async selectTreeObject(obj: KritzelBaseObject) {
    this.selectedObject.set(obj);
    await this.editor.panToObject(obj);
    await this.editor.selectObjects([obj]);
  }

  async deleteTreeObject(event: Event, obj: KritzelBaseObject) {
    event.stopPropagation();
    await this.editor.removeObject(obj);
  }

  getTextContent(obj: KritzelBaseObject): string {
    return (obj as any).text ?? '';
  }

  getShapeFillColor(obj: KritzelBaseObject): string {
    return this.resolveThemeColor((obj as any).fillColor, '#ffffff');
  }

  getPathFillColor(obj: KritzelBaseObject): string {
    return this.resolveThemeColor((obj as any).fill, '#000000');
  }

  getPathStrokeColor(obj: KritzelBaseObject): string {
    return this.resolveThemeColor((obj as any).stroke, '#000000');
  }

  getOpacityPercent(obj: KritzelBaseObject): number {
    return Math.round((obj.opacity ?? 1) * 100);
  }

  async updateSelectedProperty(prop: string, event: Event) {
    const active = this.selectedObject();
    if (!active) {
      return;
    }

    let value: any;
    if (event.target instanceof HTMLInputElement) {
      if (event.target.type === 'number' || event.target.type === 'range') {
        value = parseFloat(event.target.value);
      } else {
        value = event.target.value;
      }
    } else {
      value = (event.target as any).value;
    }

    const payload: any = {};
    if (prop === 'fillColor' || prop === 'fill' || prop === 'stroke') {
      payload[prop] = { light: value, dark: value };
    } else {
      payload[prop] = value;
    }

    await this.editor.updateObject(active, payload);
  }

  private async syncInspectorWithSelection() {
    const selected = await this.editor.getSelectedObjects();
    this.selectedObject.set(selected[0] ?? null);
  }

  private async applyTypeOpacityFilter() {
    const types = this.selectedTypes();
    const updates = this.allObjects().map((obj) => {
      const targetOpacity = types.has(obj.__class__) ? 1 : 0.5;
      const currentOpacity = obj.opacity ?? 1;
      if (currentOpacity !== targetOpacity) {
        return this.editor.updateObject(obj, { opacity: targetOpacity });
      }
      return Promise.resolve();
    });

    await Promise.all(updates);
  }

  private resolveThemeColor(raw: any, fallback: string): string {
    if (!raw) {
      return fallback;
    }
    if (typeof raw === 'object') {
      const color = raw.light || raw.dark;
      if (typeof color === 'string' && color.startsWith('#')) {
        return color;
      }
      return fallback;
    }
    if (typeof raw === 'string' && raw.startsWith('#')) {
      return raw;
    }
    return fallback;
  }

  private async seedObjects() {
    for (const obj of createSeedObjects()) {
      await this.editor.addObject(obj);
    }
  }
}
