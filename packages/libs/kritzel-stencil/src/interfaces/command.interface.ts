export interface KritzelCommand {
    initiator: string;
    isUndoable: boolean;
    execute(): void;
    undo?(): void;
}