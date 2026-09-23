import { Component, Host, h, Prop, Event, EventEmitter } from '@stencil/core';
import { ArrowHeadStyle, LineArrowConfig } from '@kritzel/engine';

export type LineEndingType = 'none' | ArrowHeadStyle;

export interface LineEndingsValue {
  start: LineEndingType;
  end: LineEndingType;
}

@Component({
  tag: 'kritzel-line-endings',
  styleUrl: 'kritzel-line-endings.css',
  shadow: true,
})
export class KritzelLineEndings {
  /** Available ending styles */
  @Prop() styles: LineEndingType[] = ['none', 'triangle'];

  /** Current line arrow configuration */
  @Prop({ mutable: true }) value: LineArrowConfig | undefined;

  @Event() valueChange: EventEmitter<LineArrowConfig>;

  private getStartEnding(): LineEndingType {
    if (!this.value?.start?.enabled) return 'none';
    return this.value.start.style ?? 'triangle';
  }

  private getEndEnding(): LineEndingType {
    if (!this.value?.end?.enabled) return 'none';
    return this.value.end.style ?? 'triangle';
  }

  private handleStartChange(type: LineEndingType) {
    const newValue: LineArrowConfig = {
      ...this.value,
      start: type === 'none'
        ? { enabled: false }
        : { enabled: true, style: type },
    };
    this.value = newValue;
    this.valueChange.emit(newValue);
  }

  private handleEndChange(type: LineEndingType) {
    const newValue: LineArrowConfig = {
      ...this.value,
      end: type === 'none'
        ? { enabled: false }
        : { enabled: true, style: type },
    };
    this.value = newValue;
    this.valueChange.emit(newValue);
  }

  private getEndingPath(type: LineEndingType): string {
    switch (type) {
      case 'triangle':
        return 'M 0 0 L 10 5 L 0 10 Z';
      case 'open':
        return 'M 0 0 L 10 5 L 0 10';
      case 'diamond':
        return 'M 0 5 L 5 0 L 10 5 L 5 10 Z';
      case 'circle':
        return 'M 10 5 A 5 5 0 1 1 0 5 A 5 5 0 1 1 10 5 Z';
      default:
        return '';
    }
  }

  private renderEndingIcon(type: LineEndingType, isStart: boolean) {
    const color = 'var(--kritzel-global-text-primary)';
    if (type === 'none') {
      return (
        <svg viewBox="0 0 24 12" class="ending-icon">
          <line
            x1={isStart ? 4 : 2}
            y1="6"
            x2={isStart ? 22 : 20}
            y2="6"
            stroke={color}
            stroke-width="2"
            stroke-linecap="round"
          />
        </svg>
      );
    }

    const path = this.getEndingPath(type);
    const isOpenStyle = type === 'open';

    return (
      <svg viewBox="0 0 24 12" class="ending-icon">
        {isStart ? (
          // Start arrow points left
          <g>
            <line x1="12" y1="6" x2="22" y2="6" stroke={color} stroke-width="2" stroke-linecap="round" />
            <g transform="translate(2, 1) scale(1, 1)">
              <path
                d={path}
                fill={isOpenStyle ? 'none' : color}
                stroke={color}
                stroke-width={isOpenStyle ? 2 : 0}
                stroke-linecap="round"
                stroke-linejoin="round"
                transform="scale(-1, 1) translate(-10, 0)"
              />
            </g>
          </g>
        ) : (
          // End arrow points right
          <g>
            <line x1="2" y1="6" x2="12" y2="6" stroke={color} stroke-width="2" stroke-linecap="round" />
            <g transform="translate(12, 1)">
              <path
                d={path}
                fill={isOpenStyle ? 'none' : color}
                stroke={color}
                stroke-width={isOpenStyle ? 2 : 0}
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </g>
          </g>
        )}
      </svg>
    );
  }

  render() {
    const startEnding = this.getStartEnding();
    const endEnding = this.getEndEnding();

    return (
      <Host>
        <div class="endings-section">
          <div class="endings-row">
            {this.styles.map(type => (
              <button
                class={{
                  'ending-option': true,
                  'selected': startEnding === type,
                }}
                onClick={() => this.handleStartChange(type)}
                title={type === 'none' ? 'No start arrow' : `${type} start arrow`}
              >
                {this.renderEndingIcon(type, true)}
              </button>
            ))}
          </div>
        </div>

        <div class="endings-section">
          <div class="endings-row">
            {this.styles.map(type => (
              <button
                class={{
                  'ending-option': true,
                  'selected': endEnding === type,
                }}
                onClick={() => this.handleEndChange(type)}
                title={type === 'none' ? 'No end arrow' : `${type} end arrow`}
              >
                {this.renderEndingIcon(type, false)}
              </button>
            ))}
          </div>
        </div>
      </Host>
    );
  }
}
