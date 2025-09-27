import { KritzelCore } from "../core/core.class";
import { KritzelBaseCommand } from "./base.command";

export class BatchCommand extends KritzelBaseCommand {
    private commands: KritzelBaseCommand[];

    constructor(core: KritzelCore, initiator: any,  commands: KritzelBaseCommand[], skipHistory = false) {
        super(core, initiator, skipHistory);
        this.commands = commands;
    }
    
    execute(): void {
        this.commands.forEach(command => command.execute());
    }
    
    undo(): void {
        this.commands.forEach(command => command.undo());
    }
}