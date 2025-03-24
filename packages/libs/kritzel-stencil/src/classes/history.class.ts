export interface KritzelPatch {
  type: 'add' | 'remove' | 'update';
  path: string[];
  value?: any;
}

export interface KritzelHistoryChange{
  undo: KritzelPatch[];
  redo: KritzelPatch[];
}

export class KritzelHistory {

  private readonly changes: KritzelHistoryChange[] = [];

  index: number;

  constructor() {
    this.index = -1;
  }

  addChange(change: KritzelHistoryChange) {
    this.changes.push(change);
    this.index++;
  }


  undo() {
  }

  redo() {
  }
}
