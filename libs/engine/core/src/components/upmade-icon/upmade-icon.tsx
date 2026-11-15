import { Component, h, Prop, Host, forceUpdate } from '@stencil/core';
import { UpdrawIconName, UpdrawIconRegistry } from '@updraw/core';

@Component({
  tag: 'updraw-icon',
  styleUrl: 'updraw-icon.css',
  shadow: true,
})
export class UpdrawIcon {
  @Prop() name: UpdrawIconName;
  @Prop() label?: string;
  @Prop() size: number = 24;

  private unsubscribe?: () => void;

  connectedCallback() {
    this.unsubscribe?.();
    this.unsubscribe = UpdrawIconRegistry.subscribe(name => {
      if (name === this.name) {
        forceUpdate(this);
      }
    });
    forceUpdate(this);
  }

  disconnectedCallback() {
    this.unsubscribe?.();
    this.unsubscribe = undefined;
  }

  render() {
    const svgContent = UpdrawIconRegistry.get(this.name);

    if (!svgContent) {
      console.error(`[updraw-icon] Icon "${this.name}" not found in registry.`);
      return <span class="error-icon" aria-label={`Error: Icon ${this.name} not found`}>?</span>;
    }

    const styles = {
      width: `${this.size}px`,
      height: `${this.size}px`,
    };

    return (
      <Host style={styles}>
        <span
          aria-hidden={!this.label}
          role={this.label ? 'img' : undefined}
          aria-label={this.label}
          innerHTML={svgContent}
        ></span>
      </Host>
    );
  }
}
