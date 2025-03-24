export interface KritzelCommand {
    execute(): void;
    undo(): void;
}