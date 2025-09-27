export interface KritzelCommand {
    initiator: string;
    skipHistory: boolean;
    execute(): void;
    undo?(): void;
}