import { KritzelBaseCommand } from "./base.command";

export class BatchCommand extends KritzelBaseCommand {
    private commands: KritzelBaseCommand[];
    
    constructor(store, initiator: any,  commands: KritzelBaseCommand[]) {
        super(store, initiator);
        this.commands = commands;
    }
    
    execute(): void {
        this.commands.forEach(command => command.execute());
    }
    
    undo(): void {
        this.commands.forEach(command => command.undo());
    }
}