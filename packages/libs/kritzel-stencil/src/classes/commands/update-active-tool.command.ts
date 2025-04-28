import { KritzelStore } from '../store.class';
import { KritzelBaseCommand } from './base.command';
import { KritzelBaseTool } from '../tools/base-tool.class';

export class UpdateActiveToolCommand extends KritzelBaseCommand {
  private tool: KritzelBaseTool;

  previousTool: KritzelBaseTool;

  constructor(store: KritzelStore, initiator: any,  tool: KritzelBaseTool) {
    super(store, initiator);
    this.tool = tool;
    this.previousTool = store.state.activeTool as KritzelBaseTool;
  }

  execute(): void {
    this._store.setState('activeTool', this.tool);
  }

  undo(): void {
    this._store.setState('activeTool', this.previousTool);
  }
}
