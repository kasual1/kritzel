import { Component, Host, Prop, h } from '@stencil/core';
import { KritzelCore } from '../../../classes/core/core.class';
import { KRITZEL_WEBSITE_URL } from '../../../constants/engine.constants';

/**
 * "Powered by Kritzel" watermark shown in the bottom-right corner of the engine
 * when the editor is not licensed.
 *
 * Rendered inside the engine's Shadow DOM and gated by the license manager on
 * the engine's reactive render path, so removing the node simply causes it to
 * reappear on the next render. The badge links to the Kritzel website.
 */
@Component({
  tag: 'kritzel-watermark',
  styleUrl: 'kritzel-watermark.css',
  shadow: true,
})
export class KritzelWatermark {
  /** The core instance used to resolve localized terms. */
  @Prop() core!: KritzelCore;

  render() {
    const label = this.core.localizationManager.translate('watermark.poweredBy');

    return (
      <Host>
        <a class="watermark-link" href={KRITZEL_WEBSITE_URL} target="_blank" rel="noopener noreferrer" part="watermark">
          {label}
        </a>
      </Host>
    );
  }
}
