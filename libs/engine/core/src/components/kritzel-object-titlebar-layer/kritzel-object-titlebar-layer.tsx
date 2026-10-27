import { Component, Host, Prop, h } from '@stencil/core';
import {
  KRITZEL_TITLEBAR_CONTROL_ATTRIBUTE,
  KRITZEL_TITLEBAR_EDITABLE_TITLE_ATTRIBUTE,
  KRITZEL_TITLEBAR_OWNER_ATTRIBUTE,
  KRITZEL_TITLEBAR_TITLE_INPUT_ATTRIBUTE,
  KritzelResolvedTitlebar,
  KritzelResolvedTitlebarElement,
} from '../../classes/managers/object-titlebar.manager';
import { KritzelTitlebarSection } from '../../interfaces/object-titlebar.interface';

/** Handles a click on a titlebar button or menu button. */
export type KritzelTitlebarElementClickHandler = (ownerId: string, section: KritzelTitlebarSection, elementId: string, event: MouseEvent, anchor: HTMLElement) => void;

/** Callbacks of the input used to rename an object. */
export interface KritzelTitlebarTitleEditHandlers {
  input: (value: string) => void;
  commit: (value: string) => void;
  cancel: () => void;
}

const parts = (...names: (string | undefined | false)[]): string => names.filter(Boolean).join(' ');

/**
 * Renders object titlebars inside the engine's world-space origin. Each anchor is placed on
 * its owner's top edge and counter-scaled, so titlebar content keeps a constant screen size.
 *
 * Rendered without a shadow root on purpose: the bars must stay in the engine's shadow tree so
 * `kritzel-engine::part(...)` styling and the engine's `elementsFromPoint` hit-testing reach them.
 * Must never use the `object` class: pointer handling treats `.object` elements as objects.
 */
@Component({
  tag: 'kritzel-object-titlebar-layer',
  styleUrl: 'kritzel-object-titlebar-layer.css',
  shadow: false,
})
export class KritzelObjectTitlebarLayer {
  /** The titlebars to render, resolved by the engine for the current frame. */
  @Prop() titlebars: KritzelResolvedTitlebar[] = [];

  /** Pointer events of the drag surfaces. Controls always receive pointer input. */
  @Prop() surfacePointerEvents: 'auto' | 'none' = 'none';

  /** Called when a titlebar button or menu button is clicked. */
  @Prop() elementClick?: KritzelTitlebarElementClickHandler;

  /** Called while a title is edited to rename its object. */
  @Prop() titleEdit?: KritzelTitlebarTitleEditHandlers;

  private readonly handleElementClick: KritzelTitlebarElementClickHandler = (...args) => this.elementClick?.(...args);

  private readonly titleEditHandlers: KritzelTitlebarTitleEditHandlers = {
    input: value => this.titleEdit?.input(value),
    commit: value => this.titleEdit?.commit(value),
    cancel: () => this.titleEdit?.cancel(),
  };

  render() {
    return (
      <Host class="object-titlebar-layer">
        {this.titlebars.map(titlebar => {
          // While a title is renamed, its input replaces all elements and spans the whole bar.
          const editedTitle = titlebar.editingElementId
            ? [...titlebar.sections.left, ...titlebar.sections.center, ...titlebar.sections.right].find(resolved => resolved.element.id === titlebar.editingElementId)
            : undefined;

          return (
            <div key={titlebar.owner.id} class="object-titlebar-anchor" style={{ transform: titlebar.transform, width: `${titlebar.width}px` }}>
              <div
                class={{
                  'object-titlebar': true,
                  'is-active': titlebar.isActive,
                  'is-editing': !!editedTitle,
                  'has-center': !editedTitle && titlebar.sections.center.length > 0,
                }}
                part={parts('titlebar', titlebar.isActive ? 'titlebar-active' : 'titlebar-inactive')}
                role="toolbar"
                aria-label={titlebar.context.title}
                data-state={titlebar.isActive ? 'active' : 'inactive'}
                data-object-type={titlebar.owner.__class__}
                data-kritzel-titlebar-surface=""
                {...{ [KRITZEL_TITLEBAR_OWNER_ATTRIBUTE]: titlebar.owner.id }}
                style={{ pointerEvents: this.surfacePointerEvents }}
              >
                {editedTitle
                  ? renderTitleInput(titlebar, editedTitle, this.titleEditHandlers)
                  : (['left', 'center', 'right'] as KritzelTitlebarSection[]).map(section =>
                      section === 'center' && titlebar.sections.center.length === 0 ? null : (
                        <div key={section} class={`object-titlebar-section object-titlebar-${section}`} part={`titlebar-${section}`}>
                          {titlebar.sections[section].map(resolved => renderElement(titlebar, resolved, this.handleElementClick))}
                        </div>
                      ),
                    )}
              </div>
            </div>
          );
        })}
      </Host>
    );
  }
}

function renderElement(titlebar: KritzelResolvedTitlebar, resolved: KritzelResolvedTitlebarElement, onElementClick: KritzelTitlebarElementClickHandler) {
  const { element } = resolved;

  switch (element.type) {
    case 'title':
      return (
        <span
          key={element.id}
          class={{ 'object-titlebar-title': true, 'is-editable': !!resolved.isEditable }}
          part={parts('titlebar-title', element.part)}
          data-element-id={element.id}
          {...(resolved.isEditable ? { [KRITZEL_TITLEBAR_EDITABLE_TITLE_ATTRIBUTE]: element.id } : {})}
          dir="auto"
        >
          {resolved.text}
        </span>
      );
    case 'text':
      return (
        <span key={element.id} class={`object-titlebar-text tone-${element.tone ?? 'default'}`} part={parts('titlebar-text', element.part)} data-element-id={element.id} dir="auto">
          {resolved.text}
        </span>
      );
    case 'icon':
      return resolved.icon ? (
        <kritzel-icon key={element.id} class="object-titlebar-icon" part={parts('titlebar-icon', element.part)} data-element-id={element.id} name={resolved.icon} size={16}></kritzel-icon>
      ) : null;
    case 'button':
    case 'menu': {
      const accessibleLabel = resolved.tooltip ?? resolved.label ?? element.id;
      const isMenu = element.type === 'menu';
      const isPressed = isMenu ? !!resolved.isMenuOpen : !!resolved.isPressed;
      return (
        <button
          key={element.id}
          type="button"
          class={{
            'object-titlebar-button': true,
            [`variant-${element.variant ?? 'ghost'}`]: true,
            'has-label': !!resolved.label,
            'is-pressed': isPressed,
          }}
          part={parts('titlebar-button', isPressed && 'titlebar-button-pressed', isMenu && 'titlebar-menu-button', element.part)}
          data-element-id={element.id}
          {...{ [KRITZEL_TITLEBAR_CONTROL_ATTRIBUTE]: '' }}
          title={resolved.tooltip}
          aria-label={accessibleLabel}
          aria-pressed={isMenu || element.isPressed === undefined ? undefined : String(isPressed)}
          aria-haspopup={isMenu ? 'menu' : undefined}
          aria-expanded={isMenu ? String(isPressed) : undefined}
          aria-disabled={resolved.isDisabled ? 'true' : undefined}
          tabindex={titlebar.isActive ? 0 : -1}
          onClick={(event: MouseEvent) => {
            const button = event.currentTarget as HTMLElement;
            // Pointer clicks should not leave focus on the button, or canvas shortcuts stop working.
            if (event.detail > 0) {
              button.blur();
            }
            onElementClick(titlebar.owner.id, resolved.section, element.id, event, button);
          }}
        >
          {resolved.icon && <kritzel-icon name={resolved.icon} size={16}></kritzel-icon>}
          {resolved.label && <span class="object-titlebar-button-label">{resolved.label}</span>}
        </button>
      );
    }
    case 'spacer':
      return <span key={element.id} class="object-titlebar-spacer" data-element-id={element.id}></span>;
    case 'separator':
      return <span key={element.id} class="object-titlebar-separator" part={parts('titlebar-separator', element.part)} data-element-id={element.id}></span>;
    default:
      return null;
  }
}

/**
 * Renders the input used to rename an object. Its value is only set when the input is created, so
 * the per-frame renders of the layer never overwrite what the user is typing.
 */
function renderTitleInput(titlebar: KritzelResolvedTitlebar, resolved: KritzelResolvedTitlebarElement, titleEdit: KritzelTitlebarTitleEditHandlers) {
  const { element } = resolved;
  const name = titlebar.owner.name ?? '';

  return (
    <input
      key={`${element.id}:input`}
      type="text"
      class="object-titlebar-title-input"
      part={parts('titlebar-title-input', element.part)}
      data-element-id={element.id}
      {...{ [KRITZEL_TITLEBAR_CONTROL_ATTRIBUTE]: '', [KRITZEL_TITLEBAR_TITLE_INPUT_ATTRIBUTE]: '' }}
      placeholder={name ? undefined : resolved.text}
      aria-label={titlebar.context.title}
      dir="auto"
      spellcheck={false}
      autocomplete="off"
      ref={(input?: HTMLInputElement) => {
        if (input && !input.dataset.initialized) {
          input.dataset.initialized = 'true';
          input.value = name;
          input.focus({ preventScroll: true });
          input.select();
        }
      }}
      onInput={(event: Event) => titleEdit.input((event.target as HTMLInputElement).value)}
      onKeyDown={(event: KeyboardEvent) => {
        if (event.key === 'Enter') {
          event.preventDefault();
          titleEdit.commit((event.target as HTMLInputElement).value);
        } else if (event.key === 'Escape') {
          event.preventDefault();
          titleEdit.cancel();
        }
      }}
      onBlur={(event: FocusEvent) => titleEdit.commit((event.target as HTMLInputElement).value)}
    />
  );
}
