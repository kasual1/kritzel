import { Component, h, Prop, Host } from '@stencil/core';
import { KritzelIconRegistry } from '../../classes/icon-registry.class';

@Component({
  tag: 'kritzel-icon',
  styleUrl: 'kritzel-icon.css',
  shadow: true,
})
export class KritzelIcon {
  @Prop()
  name: string;

  @Prop()
  label?: string;

  @Prop()
  size: number = 24;

  render() {
    const svgContent = KritzelIconRegistry.get(this.name);

    if (!svgContent) {
      console.error(`[kritzel-icon] Icon "${this.name}" not found in registry.`);
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
