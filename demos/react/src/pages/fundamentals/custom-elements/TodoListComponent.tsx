import { useEffect, useMemo, useState, type CSSProperties, type FormEvent } from "react";

type TodoItem = {
  id: number;
  title: string;
  isCompleted: boolean;
};

export type TodoListState = {
  todos: TodoItem[];
  nextId: number;
};

const DEFAULT_TODO_STATE: TodoListState = {
  nextId: 4,
  todos: [
    { id: 1, title: "Review project docs", isCompleted: true },
    { id: 2, title: "Build a React custom element", isCompleted: false },
    { id: 3, title: "Verify renderer rehydration", isCompleted: false },
  ],
};

export function cloneTodoListState(state: TodoListState): TodoListState {
  return {
    nextId: state.nextId,
    todos: state.todos.map((todo) => ({ ...todo })),
  };
}

export function createTodoListInitialState(): TodoListState {
  return cloneTodoListState(DEFAULT_TODO_STATE);
}

type TodoListComponentProps = {
  initialState?: TodoListState;
  onStateChange?: (state: TodoListState) => void;
};

export function TodoListComponent({ initialState, onStateChange }: TodoListComponentProps) {
  const startingState = useMemo(
    () => cloneTodoListState(initialState ?? createTodoListInitialState()),
    [initialState],
  );

  const [todos, setTodos] = useState<TodoItem[]>(startingState.todos);
  const [nextId, setNextId] = useState<number>(startingState.nextId);
  const [newTodo, setNewTodo] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editValue, setEditValue] = useState("");

  useEffect(() => {
    onStateChange?.({ nextId, todos: todos.map((todo) => ({ ...todo })) });
  }, [nextId, onStateChange, todos]);

  const totalCount = todos.length;
  const doneCount = todos.filter((todo) => todo.isCompleted).length;
  const openCount = totalCount - doneCount;

  function addTodo(event: FormEvent) {
    event.preventDefault();
    const title = newTodo.trim();
    if (!title) {
      return;
    }

    const id = nextId;
    setTodos((current) => [...current, { id, title, isCompleted: false }]);
    setNextId((current) => current + 1);
    setNewTodo("");
  }

  function toggleTodo(todoId: number) {
    setTodos((current) =>
      current.map((todo) => (todo.id === todoId ? { ...todo, isCompleted: !todo.isCompleted } : todo)),
    );
  }

  function deleteTodo(todoId: number) {
    setTodos((current) => current.filter((todo) => todo.id !== todoId));
    if (editingId === todoId) {
      setEditingId(null);
      setEditValue("");
    }
  }

  function startEdit(todo: TodoItem) {
    setEditingId(todo.id);
    setEditValue(todo.title);
  }

  function cancelEdit() {
    setEditingId(null);
    setEditValue("");
  }

  function saveEdit(todoId: number, event: FormEvent) {
    event.preventDefault();
    const title = editValue.trim();
    if (!title) {
      return;
    }

    setTodos((current) => current.map((todo) => (todo.id === todoId ? { ...todo, title } : todo)));
    setEditingId(null);
    setEditValue("");
  }

  return (
    <section style={cardStyle}>
      <header>
        <h1 style={headingStyle}>Todo List</h1>
        <p style={subheadingStyle}>Simple React CRUD inside a Kritzel custom element</p>
      </header>

      <form style={createFormStyle} onSubmit={addTodo}>
        <label htmlFor="react-custom-element-new-todo" style={srOnlyStyle}>New todo</label>
        <input
          id="react-custom-element-new-todo"
          type="text"
          value={newTodo}
          onChange={(event) => setNewTodo(event.target.value)}
          placeholder="Add a new task"
          style={inputStyle}
        />
        <button type="submit" disabled={newTodo.trim().length === 0} style={primaryButtonStyle}>
          Add
        </button>
      </form>

      <section style={statsStyle} aria-live="polite">
        <span>Total: {totalCount}</span>
        <span>Open: {openCount}</span>
        <span>Done: {doneCount}</span>
      </section>

      {todos.length === 0 ? (
        <p style={emptyStateStyle}>No todos yet. Add your first task above.</p>
      ) : (
        <ul style={listStyle}>
          {todos.map((todo) => {
            const isEditing = editingId === todo.id;
            return (
              <li key={todo.id} style={{ ...itemStyle, ...(todo.isCompleted ? completedItemStyle : undefined) }}>
                {isEditing ? (
                  <form style={editFormStyle} onSubmit={(event) => saveEdit(todo.id, event)}>
                    <label htmlFor={`react-custom-element-edit-${todo.id}`} style={srOnlyStyle}>Edit todo</label>
                    <input
                      id={`react-custom-element-edit-${todo.id}`}
                      type="text"
                      value={editValue}
                      onChange={(event) => setEditValue(event.target.value)}
                      style={inputStyle}
                    />
                    <div style={actionsStyle}>
                      <button type="submit" disabled={editValue.trim().length === 0} style={secondaryButtonStyle}>Save</button>
                      <button type="button" onClick={cancelEdit} style={secondaryButtonStyle}>Cancel</button>
                    </div>
                  </form>
                ) : (
                  <div style={viewRowStyle}>
                    <label style={checkboxRowStyle}>
                      <input type="checkbox" checked={todo.isCompleted} onChange={() => toggleTodo(todo.id)} />
                      <span>{todo.title}</span>
                    </label>
                    <div style={actionsStyle}>
                      <button type="button" onClick={() => startEdit(todo)} style={secondaryButtonStyle}>Edit</button>
                      <button type="button" onClick={() => deleteTodo(todo.id)} style={secondaryButtonStyle}>Delete</button>
                    </div>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

const cardStyle: CSSProperties = {
  width: "100%",
  height: "100%",
  boxSizing: "border-box",
  border: "1px solid #d5dbe8",
  borderRadius: "16px",
  padding: "20px",
  background: "#ffffff",
  overflow: "auto",
  fontFamily: "Roboto, sans-serif",
};

const headingStyle: CSSProperties = {
  margin: 0,
  fontSize: "2rem",
  color: "#1b2440",
};

const subheadingStyle: CSSProperties = {
  margin: "4px 0 0",
  color: "#4c5775",
};

const createFormStyle: CSSProperties = {
  marginTop: "16px",
  display: "grid",
  gridTemplateColumns: "1fr auto",
  gap: "8px",
};

const inputStyle: CSSProperties = {
  width: "100%",
  border: "1px solid #bfc8dc",
  borderRadius: "10px",
  padding: "10px 12px",
  fontSize: "0.98rem",
  boxSizing: "border-box",
};

const statsStyle: CSSProperties = {
  marginTop: "14px",
  display: "flex",
  gap: "12px",
  flexWrap: "wrap",
  color: "#334268",
  fontSize: "0.92rem",
};

const emptyStateStyle: CSSProperties = {
  margin: "18px 0 0",
  color: "#4f5b7b",
};

const listStyle: CSSProperties = {
  margin: "14px 0 0",
  padding: 0,
  listStyle: "none",
  display: "grid",
  gap: "10px",
};

const itemStyle: CSSProperties = {
  border: "1px solid #d7deee",
  borderRadius: "12px",
  padding: "10px",
  background: "#fbfcff",
};

const completedItemStyle: CSSProperties = {
  color: "#67718f",
  textDecoration: "line-through",
};

const viewRowStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "8px",
};

const checkboxRowStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: "8px",
};

const actionsStyle: CSSProperties = {
  display: "inline-flex",
  gap: "6px",
};

const editFormStyle: CSSProperties = {
  display: "grid",
  gap: "8px",
};

const primaryButtonStyle: CSSProperties = {
  border: "1px solid #245f8f",
  borderRadius: "10px",
  padding: "10px 14px",
  fontWeight: 600,
  color: "#ffffff",
  background: "#2b73ad",
  cursor: "pointer",
};

const secondaryButtonStyle: CSSProperties = {
  border: "1px solid #9fb0d0",
  borderRadius: "10px",
  padding: "7px 10px",
  fontWeight: 500,
  color: "#2d3b5e",
  background: "#f4f7ff",
  cursor: "pointer",
};

const srOnlyStyle: CSSProperties = {
  position: "absolute",
  width: "1px",
  height: "1px",
  padding: 0,
  margin: "-1px",
  overflow: "hidden",
  clip: "rect(0, 0, 0, 0)",
  border: 0,
};
