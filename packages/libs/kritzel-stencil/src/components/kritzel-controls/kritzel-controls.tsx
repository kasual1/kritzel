import { Component, getAssetPath, h, State } from '@stencil/core';

interface KritzelToolbarControl {
  name: string;
  icon?: string;
}

@Component({
  tag: 'kritzel-controls',
  styleUrl: 'kritzel-controls.css',
  shadow: true,
  assetsDirs: ['../assets'],
})
export class KritzelControls {
  @State() controls: KritzelToolbarControl[] = [
    {
      name: 'cursor'
    },
    {
      name: 'pen',
    },
    {
      name: 'eraser',
    },
    {
      name: 'text',
    },
    {
      name: 'image',
    },
  ];

  @State() selectedControl: string | null = null;

  kritzelEngine: HTMLKritzelEngineElement | null = null;

  componentWillLoad() {
    this.controls.forEach(async control => {
      const path = getAssetPath(`../assets/icons/${control.name}.svg`);
      const icon = await this.fetchSvgContent(path);
      this.controls = [...this.controls.map(c => (c.name === control.name ? { ...c, icon } : c))];
    });

    this.kritzelEngine = document.querySelector('kritzel-engine');
    this.kritzelEngine?.changeActiveTool('cursor');
    this.selectedControl = 'cursor';
  }

  async fetchSvgContent(iconPath: string): Promise<string> {
    const response = await fetch(iconPath);
    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('Failed to get reader from response body');
    }

    let svgContent = '';
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      svgContent += decoder.decode(value, { stream: true });
    }

    return svgContent;
  }

  preventDefault(event: Event) {
    event.preventDefault();
    event.stopPropagation();
  }

  handleControlClick(controlName: string) {
    this.selectedControl = controlName;
    this.kritzelEngine?.changeActiveTool(controlName);
  }

  render() {
    return (
      <div class="kritzel-controls">
        {this.controls.map(control => (
            <button
            class={{
              'kritzel-control': true,
              'selected': this.selectedControl === control.name,
            }}
            key={control.name}
            onClick={(event) => {
              this.preventDefault(event);
              this.handleControlClick(control.name);
            }}
            innerHTML={control.icon}
            >
            </button>
        ))}
      </div>
    );
  }
}
