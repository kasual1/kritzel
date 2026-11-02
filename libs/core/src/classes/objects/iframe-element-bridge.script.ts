/**
 * Message types of the element bridge between a `KritzelIframeObject` and its page.
 * Page → host: ready, hover, click, pick, rects, query result. Host → page: sync, query.
 */
export const IFRAME_ELEMENT_MESSAGES = {
  ready: 'kritzel-iframe-ready',
  sync: 'kritzel-iframe-element-sync',
  query: 'kritzel-iframe-element-query',
  queryResult: 'kritzel-iframe-element-query-result',
  hover: 'kritzel-iframe-element-hover',
  click: 'kritzel-iframe-element-click',
  pick: 'kritzel-iframe-element-pick',
  rects: 'kritzel-iframe-element-rects',
} as const;

/** Tag of the element that holds the highlight layer inside the page. Its shadow root keeps page CSS out. */
export const IFRAME_ELEMENT_OVERLAY_TAG = 'kritzel-element-overlay';

/** Attribute set on the page's root element while picking, used to show the default cursor everywhere. */
export const IFRAME_ELEMENT_PICKING_ATTRIBUTE = 'data-kritzel-picking';

/**
 * CSS used while picking: keeps the default cursor on links and buttons, since clicks don't activate them, and lets
 * presses on nested frames land in the page, where picking can intercept them (a nested frame's own content would
 * receive them otherwise). Pointing at a nested frame picks the element that contains it.
 */
export const IFRAME_ELEMENT_PICKING_CSS =
  `html[${IFRAME_ELEMENT_PICKING_ATTRIBUTE}], html[${IFRAME_ELEMENT_PICKING_ATTRIBUTE}] * { cursor: var(--kritzel-iframe-default-cursor) !important; }`
  + ` html[${IFRAME_ELEMENT_PICKING_ATTRIBUTE}] iframe, html[${IFRAME_ELEMENT_PICKING_ATTRIBUTE}] embed, html[${IFRAME_ELEMENT_PICKING_ATTRIBUTE}] object { pointer-events: none !important; }`;

/**
 * Creates the script that runs in the page's `<head>`, before any script of the content. It describes,
 * highlights and tracks elements and reports hovers, clicks and picks to the host. Running first lets its
 * window capture listeners see presses before the content does, which picking relies on.
 *
 * It is plain JavaScript in a string because it runs in the sandboxed page, and is wrapped in a function so its
 * names can't clash with the content's scripts. It must stay free of `</script` so it can be inlined into `srcdoc`.
 */
export function createIframeElementBridgeScript(documentToken: number): string {
  return `(() => {
  'use strict';
  const MESSAGES = ${JSON.stringify(IFRAME_ELEMENT_MESSAGES)};
  const DOCUMENT = ${Number(documentToken) || 0};
  const OVERLAY_TAG = '${IFRAME_ELEMENT_OVERLAY_TAG}';
  const PICKING_ATTRIBUTE = '${IFRAME_ELEMENT_PICKING_ATTRIBUTE}';
  const MAX_TEXT = 200;
  const MAX_ATTRIBUTE = 200;
  const MAX_ATTRIBUTES = 40;
  const MAX_CLASSES = 20;
  const MAX_MATCHES = 100;
  const MAX_HIGHLIGHTS = 50;
  const MAX_TRACKED = 50;
  const MAX_QUERY = 500;
  const DEFAULT_QUERY_LIMIT = 100;
  const CLICK_SLOP = 6;
  const ATTRIBUTES = new Set(['role', 'name', 'type', 'href', 'src', 'alt', 'title', 'placeholder', 'for']);
  const SKIPPED_TEXT = new Set(['script', 'style', 'template', 'noscript']);
  const BLOCKS = new Set(['address', 'article', 'aside', 'blockquote', 'br', 'button', 'dd', 'div', 'dl', 'dt', 'fieldset', 'figcaption', 'figure', 'footer', 'form', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'header', 'hr', 'label', 'li', 'main', 'nav', 'ol', 'option', 'p', 'pre', 'section', 'table', 'td', 'th', 'tr', 'ul']);
  const host = window.parent;
  if (!host || host === window) return;

  const state = {
    interactive: false,
    picking: false,
    // null: any element can be picked. An invalid selector makes nothing pickable instead of everything.
    pickSelector: null,
    pickSelectorInvalid: false,
    pickColor: null,
    highlights: [],
    track: [],
    theme: { color: '#007AFF', backgroundColor: 'rgba(0, 122, 255, 0.12)', labelTextColor: '#ffffff' },
    // Version of the last applied sync, sent with hovers, clicks and picks so the host can judge them by this state.
    version: 0,
  };
  let hoveredTarget = null;
  let hovered = null;
  let pointerStart = null;
  let clickReported = false;
  const blockedPointers = new Set();
  let frame = 0;
  let overlayHost = null;
  let layer = null;
  let topLayer = [];
  let reportedRects = new Map();
  const supportsColorMix = !!(window.CSS && CSS.supports && CSS.supports('color', 'color-mix(in srgb, red 12%, transparent)'));
  const supportsPopover = typeof HTMLElement !== 'undefined' && 'showPopover' in HTMLElement.prototype;

  const post = message => {
    message.doc = DOCUMENT;
    try { host.postMessage(message, '*'); } catch (error) { /* The host is gone. */ }
  };
  const clip = (value, max) => value.length > max ? value.slice(0, max - 1) + '\\u2026' : value;
  const escape = value => window.CSS && CSS.escape ? CSS.escape(value) : String(value).replace(/[^a-zA-Z0-9_-]/g, character => '\\\\' + character);
  const round = value => Math.round(value * 100) / 100;
  const isOverlay = element => !!element && element.localName === OVERLAY_TAG;
  const queryAll = selector => {
    try { return Array.from(document.querySelectorAll(selector)).filter(element => !isOverlay(element)); } catch (error) { return null; }
  };
  const matchesExactly = (selector, element) => {
    const matches = queryAll(selector);
    return !!matches && matches.length === 1 && matches[0] === element;
  };
  const uniqueAnchor = element => {
    const kritzelId = element.getAttribute('data-kritzel-id');
    if (kritzelId) {
      const selector = '[data-kritzel-id="' + escape(kritzelId) + '"]';
      if (matchesExactly(selector, element)) return selector;
    }
    if (element.id) {
      const selector = '#' + escape(element.id);
      if (matchesExactly(selector, element)) return selector;
    }
    return null;
  };
  const selectorFor = element => {
    if (element === document.documentElement) return 'html';
    if (element === document.body) return 'body';
    const parts = [];
    let current = element;
    while (current && current.nodeType === 1) {
      const anchor = uniqueAnchor(current);
      if (anchor) { parts.unshift(anchor); break; }
      if (current === document.body) { parts.unshift('body'); break; }
      if (current === document.documentElement) { parts.unshift('html'); break; }
      let part = escape(current.localName);
      const parent = current.parentElement;
      if (parent) {
        const siblings = Array.from(parent.children).filter(sibling => sibling.localName === current.localName);
        if (siblings.length > 1) part += ':nth-of-type(' + (siblings.indexOf(current) + 1) + ')';
      }
      parts.unshift(part);
      current = parent;
    }
    return parts.join(' > ');
  };
  const textOf = element => {
    if (SKIPPED_TEXT.has(element.localName)) return '';
    let text = '';
    const walker = document.createTreeWalker(element, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT, {
      acceptNode: node => node.nodeType === 1 && (SKIPPED_TEXT.has(node.localName) || isOverlay(node)) ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT,
    });
    let node = walker.nextNode();
    while (node && text.length <= MAX_TEXT * 4) {
      if (node.nodeType === 3) text += node.data;
      else if (BLOCKS.has(node.localName)) text += ' ';
      node = walker.nextNode();
    }
    return clip(text.replace(/\\s+/g, ' ').trim(), MAX_TEXT);
  };
  const toRect = rect => ({ x: round(rect.left), y: round(rect.top), width: round(rect.width), height: round(rect.height) });

  // The part of an element that can be seen: its border box clipped by every ancestor that clips its overflow and
  // by the page's viewport. null for elements that are not rendered, invisible or scrolled out of view.
  // clipCache memoizes the clip box of ancestors within one frame.
  const clipBoxOf = (ancestor, clipCache) => {
    if (clipCache && clipCache.has(ancestor)) return clipCache.get(ancestor);
    const style = getComputedStyle(ancestor);
    let box = null;
    if (style.overflowX !== 'visible' || style.overflowY !== 'visible' || /paint|strict|content/.test(style.contain || '')) {
      const rect = ancestor.getBoundingClientRect();
      const left = rect.left + ancestor.clientLeft;
      const top = rect.top + ancestor.clientTop;
      box = { left, top, right: left + ancestor.clientWidth, bottom: top + ancestor.clientHeight };
    }
    const result = { box, fixed: style.position === 'fixed' };
    if (clipCache) clipCache.set(ancestor, result);
    return result;
  };
  const visibleRectOf = (element, clipCache) => {
    if (!element.isConnected || element.getClientRects().length === 0) return null;
    const style = getComputedStyle(element);
    if (style.visibility === 'hidden' || style.visibility === 'collapse') return null;
    const rect = element.getBoundingClientRect();
    if (rect.width === 0 && rect.height === 0) return null;
    let left = rect.left;
    let top = rect.top;
    let right = rect.right;
    let bottom = rect.bottom;
    // Fixed elements are only clipped by the viewport.
    if (style.position !== 'fixed') {
      for (let ancestor = element.parentElement; ancestor && ancestor !== document.documentElement; ancestor = ancestor.parentElement) {
        const clipping = clipBoxOf(ancestor, clipCache);
        if (clipping.box) {
          left = Math.max(left, clipping.box.left);
          top = Math.max(top, clipping.box.top);
          right = Math.min(right, clipping.box.right);
          bottom = Math.min(bottom, clipping.box.bottom);
        }
        if (clipping.fixed) break;
      }
    }
    left = Math.max(left, 0);
    top = Math.max(top, 0);
    right = Math.min(right, document.documentElement.clientWidth || window.innerWidth);
    bottom = Math.min(bottom, document.documentElement.clientHeight || window.innerHeight);
    if (right <= left && bottom <= top) return null;
    if (right < left || bottom < top) return null;
    return { left, top, width: right - left, height: bottom - top };
  };

  const describe = element => {
    const attributes = {};
    let count = 0;
    for (const attribute of Array.from(element.attributes)) {
      if (count >= MAX_ATTRIBUTES) break;
      const name = attribute.name.toLowerCase();
      if (ATTRIBUTES.has(name) || name.startsWith('aria-') || name.startsWith('data-')) {
        attributes[name] = clip(attribute.value, MAX_ATTRIBUTE);
        count++;
      }
    }
    const info = {
      selector: selectorFor(element),
      tagName: element.localName,
      classList: Array.from(element.classList).slice(0, MAX_CLASSES).map(name => clip(name, MAX_ATTRIBUTE)),
      attributes,
      rect: toRect(element.getBoundingClientRect()),
    };
    const visibleRect = visibleRectOf(element, null);
    if (visibleRect) info.visibleRect = toRect(visibleRect);
    const kritzelId = element.getAttribute('data-kritzel-id');
    if (kritzelId) info.kritzelId = clip(kritzelId, MAX_ATTRIBUTE);
    if (element.id) info.id = clip(element.id, MAX_ATTRIBUTE);
    const text = textOf(element);
    if (text) info.text = text;
    return info;
  };
  const shortName = element => {
    const kritzelId = element.getAttribute('data-kritzel-id');
    if (kritzelId) return clip(kritzelId, 60);
    let name = element.localName;
    if (element.id) return clip(name + '#' + element.id, 60);
    const classes = Array.from(element.classList).slice(0, 2);
    if (classes.length) name += '.' + classes.join('.');
    return clip(name, 60);
  };
  // The element a press or hover refers to: the innermost element, or while picking with a selector the closest
  // matching ancestor.
  const resolve = (node, forPicking) => {
    let element = node && node.nodeType === 1 ? node : node && node.parentElement;
    if (!element || isOverlay(element)) return null;
    if (forPicking && state.pickSelectorInvalid) return null;
    if (forPicking && state.pickSelector) {
      try { element = element.closest(state.pickSelector); } catch (error) { element = null; }
    }
    return element;
  };
  const modifiers = event => ({ shiftKey: event.shiftKey, ctrlKey: event.ctrlKey, altKey: event.altKey, metaKey: event.metaKey });

  const setHovered = target => {
    hoveredTarget = target;
    const element = resolve(target, state.picking);
    if (element === hovered) return;
    hovered = element;
    post({ type: MESSAGES.hover, element: element ? describe(element) : null, version: state.version });
    schedule();
  };

  // The overlay lives in the top layer when the browser supports popovers, so highlights stay above modal dialogs
  // and popovers of the page. It is raised again whenever the page opens another top layer element.
  const openTopLayer = () => {
    for (const selector of [':modal, :popover-open', 'dialog[open]']) {
      try { return Array.from(document.querySelectorAll(selector)).filter(element => element !== overlayHost); } catch (error) { /* Unsupported selector. */ }
    }
    return [];
  };
  const raiseOverlay = force => {
    if (!supportsPopover) return;
    const current = openTopLayer();
    const opened = current.some(element => !topLayer.includes(element));
    topLayer = current;
    if (!force && !opened && overlayHost.matches(':popover-open')) return;
    try {
      if (overlayHost.matches(':popover-open')) overlayHost.hidePopover();
      overlayHost.showPopover();
    } catch (error) { /* Not connected yet. */ }
  };
  const ensureOverlay = () => {
    if (!overlayHost) {
      overlayHost = document.createElement(OVERLAY_TAG);
      overlayHost.setAttribute('aria-hidden', 'true');
      if (supportsPopover) overlayHost.setAttribute('popover', 'manual');
      overlayHost.style.cssText = 'all: initial !important; display: block !important; position: fixed !important; inset: 0 !important; z-index: 2147483647 !important; pointer-events: none !important; contain: strict !important;';
      const root = overlayHost.attachShadow({ mode: 'closed' });
      const style = document.createElement('style');
      style.textContent = '.box { position: fixed; box-sizing: border-box; border: 2px solid var(--color); border-radius: 3px; background: var(--background); pointer-events: none; }'
        + ' .label { position: absolute; left: -2px; bottom: 100%; margin-bottom: 2px; max-width: 240px; padding: 1px 6px; border-radius: 3px; overflow: hidden; background: var(--color); color: var(--text); font: 600 11px/16px system-ui, -apple-system, sans-serif; text-overflow: ellipsis; white-space: nowrap; }'
        + ' .label.below { bottom: auto; top: 100%; margin-top: 2px; margin-bottom: 0; }'
        + ' .label[hidden] { display: none; }';
      layer = document.createElement('div');
      root.append(style, layer);
    }
    if (overlayHost.parentNode !== document.documentElement) {
      document.documentElement.appendChild(overlayHost);
      raiseOverlay(true);
    } else {
      raiseOverlay(false);
    }
  };
  const tint = color => supportsColorMix ? 'color-mix(in srgb, ' + color + ' 12%, transparent)' : 'transparent';
  const draw = boxes => {
    if (!boxes.length) {
      if (overlayHost && overlayHost.parentNode) overlayHost.remove();
      return;
    }
    ensureOverlay();
    while (layer.children.length > boxes.length) layer.lastChild.remove();
    boxes.forEach((box, index) => {
      let element = layer.children[index];
      if (!element) {
        element = document.createElement('div');
        element.className = 'box';
        const label = document.createElement('div');
        label.className = 'label';
        element.append(label);
        layer.append(element);
      }
      const rect = box.rect;
      element.style.left = rect.left + 'px';
      element.style.top = rect.top + 'px';
      element.style.width = rect.width + 'px';
      element.style.height = rect.height + 'px';
      element.style.setProperty('--color', box.color);
      element.style.setProperty('--background', box.background);
      element.style.setProperty('--text', state.theme.labelTextColor);
      const label = element.firstChild;
      if (label.textContent !== box.label) label.textContent = box.label;
      label.hidden = !box.label;
      label.classList.toggle('below', rect.top < 20);
    });
  };
  const collectBoxes = clipCache => {
    const boxes = [];
    for (const highlight of state.highlights) {
      const matches = queryAll(highlight.selector) || [];
      for (const element of matches.slice(0, MAX_MATCHES)) {
        const rect = visibleRectOf(element, clipCache);
        if (!rect) continue;
        boxes.push({
          rect,
          color: highlight.color || state.theme.color,
          background: highlight.color ? tint(highlight.color) : state.theme.backgroundColor,
          label: highlight.label || '',
        });
      }
    }
    if (state.picking && hovered) {
      const rect = visibleRectOf(hovered, clipCache);
      if (rect) {
        boxes.push({
          rect,
          color: state.pickColor || state.theme.color,
          background: state.pickColor ? tint(state.pickColor) : state.theme.backgroundColor,
          label: shortName(hovered),
        });
      }
    }
    return boxes;
  };
  // Positions of tracked elements. An element that can't be seen is reported as null, so the host keeps its last
  // visible position.
  const reportRects = clipCache => {
    if (!state.track.length) return;
    const rects = {};
    let changed = false;
    for (const selector of state.track) {
      const element = (queryAll(selector) || [])[0];
      const visibleRect = element ? visibleRectOf(element, clipCache) : null;
      const rect = visibleRect ? toRect(visibleRect) : null;
      const key = rect ? rect.x + ',' + rect.y + ',' + rect.width + ',' + rect.height : 'none';
      if (reportedRects.get(selector) !== key) {
        reportedRects.set(selector, key);
        changed = true;
      }
      rects[selector] = rect;
    }
    if (changed) post({ type: MESSAGES.rects, rects });
  };
  const isActive = () => state.highlights.length > 0 || state.track.length > 0 || (state.picking && !!hovered);
  const render = () => {
    frame = 0;
    const clipCache = new Map();
    draw(collectBoxes(clipCache));
    reportRects(clipCache);
    if (isActive()) schedule();
  };
  function schedule() {
    if (!frame) frame = requestAnimationFrame(render);
  }

  const isValidSelector = value => {
    if (typeof value !== 'string' || !value.trim()) return false;
    try { document.querySelector(value); return true; } catch (error) { return false; }
  };
  const sync = message => {
    const wasPicking = state.picking;
    state.version = typeof message.version === 'number' ? message.version : 0;
    state.interactive = message.interactive === true;
    state.picking = message.picking === true;
    const hasPickSelector = typeof message.pickSelector === 'string' && message.pickSelector.trim() !== '';
    state.pickSelectorInvalid = hasPickSelector && !isValidSelector(message.pickSelector);
    state.pickSelector = hasPickSelector && !state.pickSelectorInvalid ? message.pickSelector : null;
    state.pickColor = typeof message.pickColor === 'string' && message.pickColor ? message.pickColor : null;
    state.highlights = (Array.isArray(message.highlights) ? message.highlights : [])
      .filter(highlight => highlight && isValidSelector(highlight.selector))
      .slice(0, MAX_HIGHLIGHTS)
      .map(highlight => ({
        selector: highlight.selector,
        color: typeof highlight.color === 'string' && highlight.color ? highlight.color : null,
        label: typeof highlight.label === 'string' ? highlight.label : '',
      }));
    state.track = (Array.isArray(message.track) ? message.track : []).filter(selector => typeof selector === 'string').slice(0, MAX_TRACKED);
    const theme = message.theme && typeof message.theme === 'object' ? message.theme : {};
    for (const key of ['color', 'backgroundColor', 'labelTextColor']) {
      if (typeof theme[key] === 'string' && theme[key]) state.theme[key] = theme[key];
    }
    const tracked = new Set(state.track);
    reportedRects = new Map(Array.from(reportedRects).filter(([selector]) => tracked.has(selector)));
    document.documentElement.toggleAttribute(PICKING_ATTRIBUTE, state.picking);
    if (!state.picking) blockedPointers.clear();
    if (!state.interactive) {
      setHovered(null);
    } else if (wasPicking !== state.picking) {
      // Report the hovered element again, so the host learns about the new mode even if the element is the same.
      hovered = undefined;
      setHovered(hoveredTarget);
    } else if (state.picking) {
      setHovered(hoveredTarget);
    }
    schedule();
  };
  const query = message => {
    const requestId = message.requestId;
    const matches = typeof message.selector === 'string' ? queryAll(message.selector) : null;
    if (!matches) {
      post({ type: MESSAGES.queryResult, requestId, error: 'Invalid selector' });
      return;
    }
    const limit = Math.max(1, Math.min(MAX_QUERY, Math.floor(Number(message.limit)) || DEFAULT_QUERY_LIMIT));
    post({ type: MESSAGES.queryResult, requestId, elements: matches.slice(0, limit).map(describe) });
  };

  window.addEventListener('message', event => {
    if (event.source !== host || !event.data || typeof event.data !== 'object') return;
    if (event.data.type === MESSAGES.sync) sync(event.data);
    else if (event.data.type === MESSAGES.query) query(event.data);
  });

  // Hover. Touch has no hover, so only mouse and pen pointers report it.
  document.addEventListener('pointerover', event => {
    if (event.pointerType !== 'touch') setHovered(event.target);
  }, true);
  document.addEventListener('pointerout', event => {
    if (event.pointerType !== 'touch' && !event.relatedTarget) setHovered(null);
  }, true);

  // While picking, presses never reach the page. These listeners run first because this script runs before any
  // script of the content and registers them on the window in the capture phase.
  const block = event => {
    event.preventDefault();
    event.stopImmediatePropagation();
  };
  for (const type of ['mousedown', 'dblclick', 'auxclick', 'dragstart', 'selectstart']) {
    window.addEventListener(type, event => {
      if (state.picking && event.isTrusted) block(event);
    }, true);
  }
  for (const type of ['touchstart', 'touchend']) {
    window.addEventListener(type, event => {
      if (state.picking && event.isTrusted) event.stopImmediatePropagation();
    }, { capture: true, passive: true });
  }
  window.addEventListener('pointerdown', event => {
    pointerStart = { x: event.screenX, y: event.screenY };
    if (state.picking && event.isTrusted) {
      blockedPointers.add(event.pointerId);
      block(event);
    }
  }, true);
  const pick = (event, target) => {
    const element = resolve(target, true);
    if (element) post(Object.assign({ type: MESSAGES.pick, element: describe(element), version: state.version }, modifiers(event)));
  };
  // Only the ends of presses that picking blocked are blocked, so a press that began before picking was turned on
  // still reaches the page and the host. Pointer presses pick on release: browsers send no click to disabled
  // controls, but they do send pointer events.
  for (const type of ['pointerup', 'pointercancel']) {
    window.addEventListener(type, event => {
      if (!blockedPointers.delete(event.pointerId)) return;
      block(event);
      if (type === 'pointerup' && state.picking && event.button === 0) pick(event, event.target);
    }, true);
  }
  window.addEventListener('mouseup', event => {
    if (state.picking && event.isTrusted && blockedPointers.size > 0) block(event);
  }, true);
  window.addEventListener('click', event => {
    if (!event.isTrusted) return;
    if (state.picking) {
      block(event);
      // Pointer presses picked on release. A click without a press (detail 0) comes from the keyboard.
      if (event.detail === 0) pick(event, event.target);
      return;
    }
    // A press that moved, e.g. to drag the object, is not a click. Keyboard clicks (detail 0) have no press.
    const start = pointerStart;
    pointerStart = null;
    if (event.detail > 0 && start && Math.hypot(event.screenX - start.x, event.screenY - start.y) > CLICK_SLOP) return;
    // Clicking a label also clicks its control in the same task. Both belong to one user click.
    if (clickReported) return;
    const element = resolve(event.target, false);
    if (!element) return;
    clickReported = true;
    setTimeout(() => { clickReported = false; }, 0);
    post(Object.assign({ type: MESSAGES.click, element: describe(element), version: state.version }, modifiers(event)));
  }, true);

  // The content's scripts have run once the document is parsed, so the host can query it from then on.
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => post({ type: MESSAGES.ready }), { once: true });
  } else {
    post({ type: MESSAGES.ready });
  }
})();`;
}
