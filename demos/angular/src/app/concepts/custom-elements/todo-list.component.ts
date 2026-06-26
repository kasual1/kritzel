import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  computed,
  signal,
} from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';

interface TodoItem {
  id: number;
  title: string;
  isCompleted: boolean;
}

export interface TodoListState {
  todos: TodoItem[];
  nextId: number;
}

const DEFAULT_TODO_STATE: TodoListState = {
  nextId: 4,
  todos: [
    { id: 1, title: 'Review project docs', isCompleted: true },
    { id: 2, title: 'Build a standalone component', isCompleted: false },
    { id: 3, title: 'Verify route integration', isCompleted: false },
  ],
};

export function createTodoListInitialState(): TodoListState {
  return {
    nextId: DEFAULT_TODO_STATE.nextId,
    todos: DEFAULT_TODO_STATE.todos.map((todo) => ({ ...todo })),
  };
}

@Component({
  selector: 'app-todo-list',
  imports: [ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.ShadowDom,
  template: `
    <section class="todo-card">
      <header class="todo-header">
        <h1>Todo List</h1>
        <p>Simple Angular CRUD with signals</p>
      </header>

      <form class="create-form" (submit)="addTodo($event)">
        <label for="newTodo" class="sr-only">New todo</label>
        <input
          id="newTodo"
          type="text"
          [formControl]="newTodoControl"
          placeholder="Add a new task"
        />
        <button type="submit" [disabled]="newTodoControl.invalid">Add</button>
      </form>

      <section class="stats" aria-live="polite">
        <span>Total: {{ totalCount() }}</span>
        <span>Open: {{ openCount() }}</span>
        <span>Done: {{ doneCount() }}</span>
      </section>

      @if (todos().length === 0) {
        <p class="empty">No todos yet. Add your first task above.</p>
      } @else {
        <ul class="todo-list">
          @for (todo of todos(); track todo.id) {
            <li
              class="todo-item"
              [class.completed]="todo.isCompleted"
              [class.editing]="editingId() === todo.id"
            >
              @if (editingId() === todo.id) {
                <form class="edit-form" (submit)="saveEdit(todo.id, $event)">
                  <label [for]="'edit-' + todo.id" class="sr-only">Edit todo</label>
                  <input
                    [id]="'edit-' + todo.id"
                    type="text"
                    [formControl]="editControl"
                  />
                  <div class="actions">
                    <button type="submit" [disabled]="editControl.invalid">
                      Save
                    </button>
                    <button type="button" (click)="cancelEdit()">Cancel</button>
                  </div>
                </form>
              } @else {
                <div class="view-row">
                  <label class="checkbox-row">
                    <input
                      type="checkbox"
                      [checked]="todo.isCompleted"
                      (change)="toggleTodo(todo.id)"
                    />
                    <span>{{ todo.title }}</span>
                  </label>
                  <div class="actions">
                    <button type="button" (click)="startEdit(todo)">Edit</button>
                    <button type="button" (click)="deleteTodo(todo.id)">Delete</button>
                  </div>
                </div>
              }
            </li>
          }
        </ul>
      }
    </section>
  `,
  styles: [
    `
      :host {
        display: block;
        width: 100%;
        height: 100%;
        min-width: 0;
        min-height: 0;
        box-sizing: border-box;
        border: 1px solid #d5dbe8;
        border-radius: 16px;
        padding: 20px;
        background: #ffffff;
        overflow: auto;
      }

      *,
      *::before,
      *::after {
        box-sizing: border-box;
      }

      .todo-card {
        width: 100%;
        min-height: 100%;
        margin: 0;
      }

      .todo-header h1 {
        margin: 0;
        font-size: 2rem;
        color: #1b2440;
      }

      .todo-header p {
        margin: 4px 0 0;
        color: #4c5775;
      }

      .create-form {
        margin-top: 16px;
        display: grid;
        grid-template-columns: 1fr auto;
        gap: 8px;
      }

      input[type='text'] {
        width: 100%;
        border: 1px solid #bfc8dc;
        border-radius: 10px;
        padding: 10px 12px;
        font-size: 0.98rem;
      }

      button {
        border: 1px solid #245f8f;
        border-radius: 10px;
        padding: 10px 14px;
        font-weight: 600;
        color: #ffffff;
        background: #2b73ad;
        cursor: pointer;
      }

      button:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }

      .stats {
        margin-top: 14px;
        display: flex;
        gap: 12px;
        flex-wrap: wrap;
        color: #334268;
        font-size: 0.92rem;
      }

      .empty {
        margin: 18px 0 0;
        color: #4f5b7b;
      }

      .todo-list {
        margin: 14px 0 0;
        padding: 0;
        list-style: none;
        display: grid;
        gap: 10px;
      }

      .todo-item {
        border: 1px solid #d7deee;
        border-radius: 12px;
        padding: 10px;
        background: #fbfcff;
      }

      .todo-item.completed .view-row span {
        text-decoration: line-through;
        color: #67718f;
      }

      .view-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
      }

      .checkbox-row {
        display: inline-flex;
        align-items: center;
        gap: 8px;
      }

      .actions {
        display: inline-flex;
        gap: 6px;
      }

      .actions button {
        padding: 7px 10px;
      }

      .edit-form {
        display: grid;
        gap: 8px;
      }

      .sr-only {
        position: absolute;
        width: 1px;
        height: 1px;
        padding: 0;
        margin: -1px;
        overflow: hidden;
        clip: rect(0, 0, 0, 0);
        border: 0;
      }

      @media (max-width: 640px) {
        :host {
          padding: 14px;
        }

        .view-row {
          flex-direction: column;
          align-items: flex-start;
        }
      }
    `,
  ],
})
export class TodoListComponent {
  private nextId = DEFAULT_TODO_STATE.nextId;

  readonly todos = signal<TodoItem[]>(
    DEFAULT_TODO_STATE.todos.map((todo) => ({ ...todo })),
  );

  readonly newTodoControl = new FormControl('', {
    nonNullable: true,
    validators: [Validators.required],
  });

  readonly editControl = new FormControl('', {
    nonNullable: true,
    validators: [Validators.required],
  });

  readonly editingId = signal<number | null>(null);

  readonly totalCount = computed(() => this.todos().length);
  readonly doneCount = computed(
    () => this.todos().filter((todo) => todo.isCompleted).length,
  );
  readonly openCount = computed(() => this.totalCount() - this.doneCount());

  initializeFromState(state?: TodoListState): void {
    if (!state) {
      return;
    }

    const todos = (state.todos ?? []).map((todo) => ({ ...todo }));
    this.todos.set(todos);

    const maxId = todos.reduce((max, todo) => Math.max(max, todo.id), 0);
    this.nextId = Math.max(state.nextId ?? maxId + 1, maxId + 1);

    this.cancelEdit();
    this.newTodoControl.setValue('');
  }

  exportState(): TodoListState {
    return {
      nextId: this.nextId,
      todos: this.todos().map((todo) => ({ ...todo })),
    };
  }

  addTodo(event: Event): void {
    event.preventDefault();

    const title = this.newTodoControl.value.trim();
    if (!title) {
      return;
    }

    this.todos.update((todos) => [
      ...todos,
      {
        id: this.nextId++,
        title,
        isCompleted: false,
      },
    ]);

    this.newTodoControl.setValue('');
  }

  toggleTodo(todoId: number): void {
    this.todos.update((todos) =>
      todos.map((todo) =>
        todo.id === todoId
          ? { ...todo, isCompleted: !todo.isCompleted }
          : todo,
      ),
    );
  }

  startEdit(todo: TodoItem): void {
    this.editingId.set(todo.id);
    this.editControl.setValue(todo.title);
  }

  saveEdit(todoId: number, event: Event): void {
    event.preventDefault();

    const title = this.editControl.value.trim();
    if (!title) {
      return;
    }

    this.todos.update((todos) =>
      todos.map((todo) => (todo.id === todoId ? { ...todo, title } : todo)),
    );

    this.cancelEdit();
  }

  cancelEdit(): void {
    this.editingId.set(null);
    this.editControl.setValue('');
  }

  deleteTodo(todoId: number): void {
    this.todos.update((todos) => todos.filter((todo) => todo.id !== todoId));

    if (this.editingId() === todoId) {
      this.cancelEdit();
    }
  }
}
