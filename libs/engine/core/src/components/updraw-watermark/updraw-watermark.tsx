import { Component, Host, Prop, h } from '@stencil/core';
import { KritzelCore, KRITZEL_WEBSITE_URL } from '@kritzel/core';

/**
 * "Powered by Kritzel" watermark shown in the bottom-right corner of the engine.
 *
 * Rendered inside the engine's Shadow DOM unless the engine's
 * `isWatermarkVisible` prop is set to false. The badge links to the Kritzel
 * website.
 */
@Component({
  tag: 'kritzel-watermark',
  styleUrl: 'kritzel-watermark.css',
  shadow: true,
})
export class KritzelWatermark {
  /** The core instance used to resolve localized terms. */
  @Prop() core!: KritzelCore;

  /**
   * Resolved "Powered by Kritzel" label. Passed in by the engine so the badge
   * re-renders when the active locale changes. Falls back to resolving the term
   * from the core when not provided.
   */
  @Prop() label?: string;

  render() {
    const label = this.label ?? this.core.localizationManager.translate('watermark.poweredBy');

    return (
      <Host>
        <a
          class="watermark-link"
          href={KRITZEL_WEBSITE_URL}
          target="_blank"
          rel="noopener noreferrer"
          part="watermark"
          onPointerDown={(ev: PointerEvent) => ev.stopPropagation()}
          onPointerUp={(ev: PointerEvent) => ev.stopPropagation()}
        >
          {label}
        </a>
      </Host>
    );
  }
}
