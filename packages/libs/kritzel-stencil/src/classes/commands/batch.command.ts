import { KritzelBaseCommand } from "./base.command";

export class BatchCommand extends KritzelBaseCommand {
    private commands: KritzelBaseCommand[];
    
    constructor(store, commands: KritzelBaseCommand[]) {
        super(store);
        this.commands = commands;
    }
    
    execute(): void {
        this.commands.forEach(command => command.execute());
    }
    
    undo(): void {
        this.commands.forEach(command => command.undo());
    }
}