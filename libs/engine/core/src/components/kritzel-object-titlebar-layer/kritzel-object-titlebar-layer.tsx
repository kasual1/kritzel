import { FunctionalComponent, h } from '@stencil/core';
import {
  KRITZEL_TITLEBAR_CONTROL_ATTRIBUTE,
  KRITZEL_TITLEBAR_OWNER_ATTRIBUTE,
  KritzelResolvedTitlebar,
  KritzelResolvedTitlebarItem,
} from '../../classes/managers/object-titlebar.manager';
import { KritzelTitlebarSection } from '../../interfaces/object-titlebar.interface';

export interface ObjectTitlebarLayerProps {
  titlebars: KritzelResolvedTitlebar[];
  /** Pointer events of the drag surfaces. Controls always receive pointer input. */
  surfacePointerEvents: 'auto' | 'none';
  onItemClick: (ownerId: string, section: KritzelTitlebarSection, itemId: string, event: MouseEvent, anchorRect: DOMRect) => void;
}

const parts = (...names: (string | undefined | false)[]): string => names.filter(Boolean).join(' ');

/**
 * Renders object titlebars inside the engine's world-space origin. Each anchor is placed on
 * its owner's top edge and counter-scaled, so titlebar content keeps a constant screen size.
 * Must never use the `object` class: pointer handling treats `.object` elements as objects.
 */
export const ObjectTitlebarLayer: FunctionalComponent<ObjectTitlebarLayerProps> = ({ titlebars, surfacePointerEvents, onItemClick }) => {
  if (titlebars.length === 0) {
    return null;
  }

  return (
    <div class="object-titlebar-layer">
      {titlebars.map(titlebar => (
        <div key={titlebar.owner.id} class="object-titlebar-anchor" style={{ transform: titlebar.transform, width: `${titlebar.width}px` }}>
          <div
            class={{
              'object-titlebar': true,
              'is-active': titlebar.isActive,
              'has-center': titlebar.sections.center.length > 0,
            }}
            part={parts('titlebar', titlebar.isActive ? 'titlebar-active' : 'titlebar-inactive')}
            role="toolbar"
            aria-label={titlebar.context.title}
            data-state={titlebar.isActive ? 'active' : 'inactive'}
            data-object-type={titlebar.owner.__class__}
            data-kritzel-titlebar-surface=""
            {...{ [KRITZEL_TITLEBAR_OWNER_ATTRIBUTE]: titlebar.owner.id }}
            style={{ pointerEvents: surfacePointerEvents }}
          >
            {(['left', 'center', 'right'] as KritzelTitlebarSection[]).map(section =>
              section === 'center' && titlebar.sections.center.length === 0 ? null : (
                <div key={section} class={`object-titlebar-section object-titlebar-${section}`} part={`titlebar-${section}`}>
                  {titlebar.sections[section].map(resolved => renderItem(titlebar, resolved, onItemClick))}
                </div>
              ),
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

function renderItem(titlebar: KritzelResolvedTitlebar, resolved: KritzelResolvedTitlebarItem, onItemClick: ObjectTitlebarLayerProps['onItemClick']) {
  const { item } = resolved;

  switch (item.type) {
    case 'title':
      return (
        <span key={item.id} class="object-titlebar-title" part={parts('titlebar-title', item.part)} data-item-id={item.id} dir="auto">
          {resolved.text}
        </span>
      );
    case 'text':
      return (
        <span key={item.id} class={`object-titlebar-text tone-${item.tone ?? 'default'}`} part={parts('titlebar-text', item.part)} data-item-id={item.id} dir="auto">
          {resolved.text}
        </span>
      );
    case 'icon':
      return resolved.icon ? <kritzel-icon key={item.id} class="object-titlebar-icon" part={parts('titlebar-icon', item.part)} data-item-id={item.id} name={resolved.icon} size={16}></kritzel-icon> : null;
    case 'button': {
      const accessibleLabel = resolved.tooltip ?? resolved.label ?? item.id;
      return (
        <button
          key={item.id}
          type="button"
          class={{
            'object-titlebar-button': true,
            [`variant-${item.variant ?? 'ghost'}`]: true,
            'has-label': !!resolved.label,
            'is-pressed': !!resolved.isPressed,
          }}
          part={parts('titlebar-button', resolved.isPressed && 'titlebar-button-pressed', item.part)}
          data-item-id={item.id}
          {...{ [KRITZEL_TITLEBAR_CONTROL_ATTRIBUTE]: '' }}
          title={resolved.tooltip}
          aria-label={accessibleLabel}
          aria-pressed={item.isPressed === undefined ? undefined : String(!!resolved.isPressed)}
          aria-disabled={resolved.isDisabled ? 'true' : undefined}
          tabindex={titlebar.isActive ? 0 : -1}
          onClick={(event: MouseEvent) => {
            const button = event.currentTarget as HTMLElement;
            const anchorRect = button.getBoundingClientRect();
            // Pointer clicks should not leave focus on the button, or canvas shortcuts stop working.
            if (event.detail > 0) {
              button.blur();
            }
            onItemClick(titlebar.owner.id, resolved.section, item.id, event, anchorRect);
          }}
        >
          {resolved.icon && <kritzel-icon name={resolved.icon} size={16}></kritzel-icon>}
          {resolved.label && <span class="object-titlebar-button-label">{resolved.label}</span>}
        </button>
      );
    }
    case 'spacer':
      return <span key={item.id} class="object-titlebar-spacer" data-item-id={item.id}></span>;
    case 'separator':
      return <span key={item.id} class="object-titlebar-separator" part={parts('titlebar-separator', item.part)} data-item-id={item.id}></span>;
    default:
      return null;
  }
}
