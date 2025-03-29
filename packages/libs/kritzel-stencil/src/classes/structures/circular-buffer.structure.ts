export class KritzelCircularBuffer<T> {
  private buffer: (T | null)[];
  private capacity: number;
  private head: number = 0;
  private tail: number = 0;
  private size: number = 0;

  constructor(capacity: number) {
    this.capacity = capacity;
    this.buffer = new Array(capacity).fill(null);
  }

  add(item: T): void {
    this.buffer[this.head] = item;
    this.head = (this.head + 1) % this.capacity;

    if (this.size < this.capacity) {
      this.size++;
    } else {
      this.tail = (this.tail + 1) % this.capacity;
    }
  }

  pop(): T | null {
    if (this.size === 0) {
      return null;
    }

    this.head = (this.head - 1 + this.capacity) % this.capacity;
    const item = this.buffer[this.head];
    this.buffer[this.head] = null;
    this.size--;
    return item;
  }

  peek(): T | null {
    if (this.size === 0) {
      return null;
    }

    const lastIndex = (this.head - 1 + this.capacity) % this.capacity;
    return this.buffer[lastIndex];
  }

  isEmpty(): boolean {
    return this.size === 0;
  }

  clear(): void {
    this.buffer.fill(null);
    this.head = 0;
    this.tail = 0;
    this.size = 0;
  }
}
