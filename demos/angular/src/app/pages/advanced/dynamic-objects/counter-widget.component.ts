import { ChangeDetectionStrategy, Component, signal } from '@angular/core';

export interface CounterWidgetState {
  count: number;
}

const DEFAULT_COUNTER_STATE: CounterWidgetState = { count: 0 };

export function createCounterWidgetInitialState(): CounterWidgetState {
  return { ...DEFAULT_COUNTER_STATE };
}

@Component({
  selector: 'app-counter-widget',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="counter-card">
      <h3>Angular Counter</h3>
      <p>This is a real, running Angular component mounted into the custom-element object.</p>
      <div class="controls">
        <button type="button" (click)="decrement()">-</button>
        <span class="count">{{ count() }}</span>
        <button type="button" (click)="increment()">+</button>
      </div>
    </section>
  `,
  styles: [`
    :host { display: block; height: 100%; box-sizing: border-box; }
    .counter-card { display: flex; flex-direction: column; gap: 10px; padding: 14px; height: 100%; box-sizing: border-box; font-family: Roboto, sans-serif; }
    h3 { margin: 0; font-size: 15px; }
    p { margin: 0; font-size: 12px; color: #555; }
    .controls { display: flex; align-items: center; gap: 12px; margin-top: auto; }
    button { width: 32px; height: 32px; border-radius: 6px; border: 1px solid #dd0031; background: #ffffff; color: #dd0031; cursor: pointer; font-size: 16px; }
    .count { font-size: 20px; font-weight: 700; min-width: 24px; text-align: center; }
  `],
})
export class CounterWidgetComponent {
  count = signal(DEFAULT_COUNTER_STATE.count);

  initializeFromState(state?: CounterWidgetState): void {
    this.count.set(state?.count ?? DEFAULT_COUNTER_STATE.count);
  }

  exportState(): CounterWidgetState {
    return { count: this.count() };
  }

  increment(): void {
    this.count.update((value) => value + 1);
  }

  decrement(): void {
    this.count.update((value) => value - 1);
  }
}
