import { Component, h, Prop, Host, forceUpdate } from '@stencil/core';
import { UpmadeIconName, UpmadeIconRegistry } from '@upmade/core';

@Component({
  tag: 'upmade-icon',
  styleUrl: 'upmade-icon.css',
  shadow: true,
})
export class UpmadeIcon {
  @Prop() name: UpmadeIconName;
  @Prop() label?: string;
  @Prop() size: number = 24;

  private unsubscribe?: () => void;

  connectedCallback() {
    this.unsubscribe?.();
    this.unsubscribe = UpmadeIconRegistry.subscribe(name => {
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
    const svgContent = UpmadeIconRegistry.get(this.name);

    if (!svgContent) {
      console.error(`[upmade-icon] Icon "${this.name}" not found in registry.`);
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
