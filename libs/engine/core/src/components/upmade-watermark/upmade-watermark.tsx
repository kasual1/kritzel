import { Component, Host, Prop, h } from '@stencil/core';
import { UpmadeCore, UPMADE_WEBSITE_URL } from '@upmade/core';

/**
 * "Powered by Upmade" watermark shown in the bottom-right corner of the engine.
 *
 * Rendered inside the engine's Shadow DOM unless the engine's
 * `isWatermarkVisible` prop is set to false. The badge links to the Upmade
 * website.
 */
@Component({
  tag: 'upmade-watermark',
  styleUrl: 'upmade-watermark.css',
  shadow: true,
})
export class UpmadeWatermark {
  /** The core instance used to resolve localized terms. */
  @Prop() core!: UpmadeCore;

  /**
   * Resolved "Powered by Upmade" label. Passed in by the engine so the badge
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
          href={UPMADE_WEBSITE_URL}
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
