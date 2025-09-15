import { Component, Host, Listen, Prop, Watch, h, Event, EventEmitter } from '@stencil/core';
import { KritzelHTMLHelper } from '../../../helpers/html.helper';

const DEFAULT_OFFSET = 0;
const MIN_LEFT_POSITION = 0;
const Z_INDEX = '1';
const ID_PORTAL = 'portal';

@Component({
  tag: 'kritzel-portal',
  shadow: true,
})
export class KritzelPortal {
  @Prop()
  anchor: HTMLElement;

  @Watch('anchor')
  anchorChanged(newValue: HTMLElement) {
    if (newValue) {
      this.calculatePosition();
    }
  }

  @Prop()
  offsetX: number;

  @Prop()
  offsetY: number;

  @Prop()
  autoFocus: boolean = true;

  @Event()
  close: EventEmitter<void>;

  private portal: HTMLElement;

  private element: HTMLElement;

  private moved: boolean = false;

  private scrollableParent: HTMLElement | Window;

  @Listen('resize', { target: 'window', capture: true })
  handleResize() {
    this.calculatePosition();
  }

  private handleScroll = () => {
    const isAnchorInViewport = KritzelHTMLHelper.isElementInViewport(this.anchor);

    if (!isAnchorInViewport) {
      this.close.emit();
      return;
    }

    this.calculatePosition();
  };

  private calculateLeft() {
    if (!this.anchor || !this.portal) return 0;
    const refRect = this.anchor.getBoundingClientRect();
    const portalRect = this.portal.getBoundingClientRect();

    const offset = this.offsetX ?? DEFAULT_OFFSET;
    let left = refRect.left + offset;

    const maxLeft = window.innerWidth - portalRect.width - MIN_LEFT_POSITION;
    if (left < MIN_LEFT_POSITION) left = MIN_LEFT_POSITION;
    if (left > maxLeft) left = maxLeft;

    return Math.round(left + window.scrollX);
  }

  private calculateTop() {
    if (!this.anchor || !this.portal) return 0;
    const refRect = this.anchor.getBoundingClientRect();
    const portalRect = this.portal.getBoundingClientRect();
    const offset = this.offsetY ?? DEFAULT_OFFSET;

    let top = refRect.bottom + offset;

    if (top + portalRect.height > window.innerHeight) {
      top = refRect.top - portalRect.height - offset;
    }

    return Math.round(top + window.scrollY);
  }

  private createPortal() {
    this.portal = document.createElement('div');
    this.portal.setAttribute('id', ID_PORTAL);
    this.portal.style.zIndex = Z_INDEX;
    this.portal.style.position = 'absolute';
    this.portal.style.top = '0px';
    this.portal.style.left = '0px';
    document.body.append(this.portal);
  }

  private moveElementToPortal() {
    this.portal.appendChild(this.element);
    this.moved = true;
  }

  private calculatePosition() {
    if (!this.anchor || !this.portal) return;
    const top = this.calculateTop();
    const left = this.calculateLeft();
    this.portal.style.top = `${top}px`;
    this.portal.style.left = `${left}px`;
  }

  componentWillLoad() {
    this.createPortal();
  }

  componentDidLoad() {
    this.moveElementToPortal();
    if (this.anchor) {
      this.calculatePosition();
      this.scrollableParent = KritzelHTMLHelper.getScrollableParent(this.anchor);
      this.scrollableParent?.addEventListener('scroll', this.handleScroll);
    }
  }

  disconnectedCallback() {
    this.moved ? this.portal.remove() : (this.moved = true);
    this.scrollableParent?.removeEventListener('scroll', this.handleScroll);
  }

  render() {
    return (
      <Host style={{ display: this.anchor ? 'block' : 'none' }} ref={el => (this.element = el)}>
        <slot />
      </Host>
    );
  }
}