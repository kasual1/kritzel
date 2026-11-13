/**
 * Message types of the element bridge between an `UpdrawIframeObject` and its page.
 * Page → host: ready, hover, click, pick, rects, query result, interaction result. Host → page: sync, query, interaction.
 */
export const IFRAME_ELEMENT_MESSAGES = {
  ready: 'updraw-iframe-ready',
  sync: 'updraw-iframe-element-sync',
  query: 'updraw-iframe-element-query',
  queryResult: 'updraw-iframe-element-query-result',
  interact: 'updraw-iframe-element-interact',
  interactResult: 'updraw-iframe-element-interact-result',
  hover: 'updraw-iframe-element-hover',
  click: 'updraw-iframe-element-click',
  pick: 'updraw-iframe-element-pick',
  rects: 'updraw-iframe-element-rects',
} as const;

/** Tag of the element that holds the highlight layer inside the page. Its shadow root keeps page CSS out. */
export const IFRAME_ELEMENT_OVERLAY_TAG = 'updraw-element-overlay';

/** Attribute set on the page's root element while picking, used to show the default cursor everywhere. */
export const IFRAME_ELEMENT_PICKING_ATTRIBUTE = 'data-updraw-picking';

/**
 * CSS used while picking: keeps the default cursor on links and buttons, since clicks don't activate them, and lets
 * presses on nested frames land in the page, where picking can intercept them (a nested frame's own content would
 * receive them otherwise). Pointing at a nested frame picks the element that contains it.
 */
export const IFRAME_ELEMENT_PICKING_CSS =
  `html[${IFRAME_ELEMENT_PICKING_ATTRIBUTE}], html[${IFRAME_ELEMENT_PICKING_ATTRIBUTE}] * { cursor: var(--updraw-iframe-default-cursor) !important; }`
  + ` html[${IFRAME_ELEMENT_PICKING_ATTRIBUTE}] iframe, html[${IFRAME_ELEMENT_PICKING_ATTRIBUTE}] embed, html[${IFRAME_ELEMENT_PICKING_ATTRIBUTE}] object { pointer-events: none !important; }`;

/**
 * Creates the script that runs in the page's `<head>`, before any script of the content. It describes,
 * highlights and tracks elements, reports hovers, clicks and picks to the host, and performs interactions the
 * host asks for (agents clicking, filling or pressing keys). Running first lets its window capture listeners see
 * presses before the content does, which picking relies on.
 *
 * Interactions are dispatched as DOM events, so `isTrusted` is `false` for them and they carry no user activation:
 * the content's handlers run as for a real press, but APIs that need a user gesture (audio playback in some
 * browsers, fullscreen, the clipboard, popups) may refuse to work from them.
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
  const MAX_VALUE = 500;
  const MAX_OPTIONS = 20;
  // Time the content gets to react to an interaction (re-render, start a timer) before its result is described.
  const SETTLE_MS = 50;
  // Pointer ID of interactions, distinct from the IDs browsers give real pointers.
  const AGENT_POINTER_ID = 7331;
  // Elements a user can interact with. Elements that only show a pointer cursor count too (see isInteractive).
  const INTERACTIVE_SELECTOR = 'a[href], area[href], button, input:not([type="hidden"]), select, textarea, summary, '
    + 'audio[controls], video[controls], [contenteditable]:not([contenteditable="false"]), [tabindex]:not([tabindex="-1"]), [onclick], '
    + '[role="button"], [role="link"], [role="checkbox"], [role="radio"], [role="switch"], [role="slider"], [role="spinbutton"], '
    + '[role="tab"], [role="menuitem"], [role="menuitemcheckbox"], [role="menuitemradio"], [role="option"], [role="combobox"], '
    + '[role="textbox"], [role="searchbox"], [role="treeitem"]';
  const FOCUSABLE_SELECTOR = 'a[href], area[href], button, input, select, textarea, summary, iframe, [tabindex], [contenteditable]:not([contenteditable="false"])';
  const NOT_FILLABLE_TYPES = new Set(['checkbox', 'radio', 'button', 'submit', 'reset', 'image', 'file', 'hidden']);
  const CHECKABLE_ROLES = new Set(['checkbox', 'radio', 'switch', 'menuitemcheckbox', 'menuitemradio']);
  const BUTTON_TYPES = new Set(['button', 'submit', 'reset', 'image', 'checkbox', 'radio']);
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
  // Queries are answered once the document is parsed, so a half-loaded page never reports missing elements.
  let isReady = false;
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
    const updrawId = element.getAttribute('data-updraw-id');
    if (updrawId) {
      const selector = '[data-updraw-id="' + escape(updrawId) + '"]';
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

  const matchesSafely = (element, selector) => {
    try { return element.matches(selector); } catch (error) { return false; }
  };
  const roleOf = element => (element.getAttribute('role') || '').trim().toLowerCase();
  const isFillable = element => element.isContentEditable || element.localName === 'textarea' || element.localName === 'select'
    || (element.localName === 'input' && !NOT_FILLABLE_TYPES.has(element.type));
  const isNativeCheckable = element => element.localName === 'input' && (element.type === 'checkbox' || element.type === 'radio');
  const isCheckable = element => isNativeCheckable(element) || CHECKABLE_ROLES.has(roleOf(element));
  const checkedOf = element => {
    if (isNativeCheckable(element)) return element.indeterminate ? 'mixed' : element.checked;
    if (!CHECKABLE_ROLES.has(roleOf(element))) return undefined;
    const checked = element.getAttribute('aria-checked');
    return checked === 'mixed' ? 'mixed' : checked === 'true';
  };
  const isDisabled = element => matchesSafely(element, ':disabled') || element.getAttribute('aria-disabled') === 'true' || !!element.closest('[inert]');
  // Native state the attributes don't show. aria-* state is in the attributes already.
  const stateOf = element => {
    const state = {};
    if (isDisabled(element)) state.disabled = true;
    const checked = checkedOf(element);
    if (checked !== undefined) state.checked = checked;
    if (element.localName === 'option') state.selected = element.selected;
    if (element.localName === 'details') state.open = element.open;
    if (document.activeElement === element && element !== document.body) state.focused = true;
    if (isFillable(element)) state.editable = element.readOnly !== true && !state.disabled;
    if (element.localName === 'audio' || element.localName === 'video') state.playing = !element.paused && !element.ended;
    return state;
  };
  // The current value of a form field; never of password fields.
  const valueOf = element => {
    if (element.localName === 'input') {
      // Checkboxes and radio buttons show their state in "checked"; their value is a constant.
      return element.type === 'password' || isNativeCheckable(element) ? undefined : clip(element.value, MAX_VALUE);
    }
    if (element.localName === 'textarea') return clip(element.value, MAX_VALUE);
    if (element.localName === 'select') {
      return clip(Array.from(element.selectedOptions).map(option => option.value).join(', '), MAX_VALUE);
    }
    return undefined;
  };
  // Whether a user could interact with an element: a control, an element with an interactive role, or one that shows
  // a pointer cursor of its own (not one inherited from an interactive ancestor), as content often makes divs clickable.
  const isInteractive = element => {
    if (isOverlay(element) || SKIPPED_TEXT.has(element.localName)) return false;
    if (matchesSafely(element, INTERACTIVE_SELECTOR)) return true;
    if (getComputedStyle(element).cursor !== 'pointer') return false;
    const parent = element.parentElement;
    return !parent || getComputedStyle(parent).cursor !== 'pointer';
  };
  const describe = (element, includeValue) => {
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
    const updrawId = element.getAttribute('data-updraw-id');
    if (updrawId) info.updrawId = clip(updrawId, MAX_ATTRIBUTE);
    if (element.id) info.id = clip(element.id, MAX_ATTRIBUTE);
    const text = textOf(element);
    if (text) info.text = text;
    const state = stateOf(element);
    if (Object.keys(state).length) info.state = state;
    if (includeValue) {
      const value = valueOf(element);
      if (value !== undefined) info.value = value;
    }
    return info;
  };
  const shortName = element => {
    const updrawId = element.getAttribute('data-updraw-id');
    if (updrawId) return clip(updrawId, 60);
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
    const elements = [];
    for (const element of matches) {
      if (elements.length >= limit) break;
      if (message.interactiveOnly === true && !isInteractive(element)) continue;
      elements.push(describe(element, message.includeValues === true));
    }
    post({ type: MESSAGES.queryResult, requestId, elements });
  };

  // ─── Interactions (agents acting in the page) ───────────────────────────
  let agentHovered = null;
  const pointOf = rect => ({ x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 });
  const mouseInit = (point, extra) => Object.assign({
    bubbles: true, cancelable: true, composed: true, view: window,
    clientX: point.x, clientY: point.y, screenX: point.x, screenY: point.y, button: 0, buttons: 0, detail: 0,
  }, extra);
  const pointerInit = (point, extra) => Object.assign(mouseInit(point, { detail: 0 }), {
    pointerId: AGENT_POINTER_ID, pointerType: 'mouse', isPrimary: true, width: 1, height: 1, pressure: 0,
  }, extra);
  const fire = (target, type, init) => {
    let event;
    if (type.startsWith('pointer') && typeof PointerEvent === 'function') event = new PointerEvent(type, init);
    else if (type === 'wheel' && typeof WheelEvent === 'function') event = new WheelEvent(type, init);
    else event = new MouseEvent(type, init);
    return target.dispatchEvent(event);
  };
  const fireEvent = (target, type, init) => target.dispatchEvent(new Event(type, Object.assign({ bubbles: true, cancelable: false, composed: true }, init)));
  const fireInput = (target, data) => {
    const init = { bubbles: true, cancelable: false, composed: true, inputType: 'insertReplacementText', data };
    target.dispatchEvent(typeof InputEvent === 'function' ? new InputEvent('input', init) : new Event('input', init));
  };
  const ancestry = element => {
    const chain = [];
    for (let current = element; current; current = current.parentElement) chain.push(current);
    return chain;
  };
  // Moves the agent's pointer onto a target: out of the previous one and the ancestors it leaves, then over the new
  // one and into the ancestors it enters, as a mouse would.
  const moveOnto = (target, point) => {
    const previous = agentHovered && agentHovered.isConnected ? agentHovered : null;
    if (previous !== target) {
      const left = previous ? ancestry(previous) : [];
      const entered = ancestry(target);
      if (previous) {
        const leaving = left.filter(element => !entered.includes(element));
        fire(previous, 'pointerout', pointerInit(point, { relatedTarget: target }));
        leaving.forEach(element => fire(element, 'pointerleave', pointerInit(point, { bubbles: false, relatedTarget: target })));
        fire(previous, 'mouseout', mouseInit(point, { relatedTarget: target }));
        leaving.forEach(element => fire(element, 'mouseleave', mouseInit(point, { bubbles: false, relatedTarget: target })));
      }
      const entering = entered.filter(element => !left.includes(element)).reverse();
      agentHovered = target;
      fire(target, 'pointerover', pointerInit(point, { relatedTarget: previous }));
      entering.forEach(element => fire(element, 'pointerenter', pointerInit(point, { bubbles: false, relatedTarget: previous })));
      fire(target, 'mouseover', mouseInit(point, { relatedTarget: previous }));
      entering.forEach(element => fire(element, 'mouseenter', mouseInit(point, { bubbles: false, relatedTarget: previous })));
    }
    fire(target, 'pointermove', pointerInit(point));
    fire(target, 'mousemove', mouseInit(point));
  };
  // A press moves the focus to the closest focusable element, or clears it. Only while the page has the focus:
  // focusing an element of a page without it would take the keyboard focus away from the host page, e.g. from the
  // chat box the user is typing in.
  const focusFrom = target => {
    if (!document.hasFocus()) return;
    const focusable = target.closest(FOCUSABLE_SELECTOR);
    if (focusable && !isDisabled(focusable)) {
      try { focusable.focus({ preventScroll: true }); } catch (error) { /* Not focusable after all. */ }
    } else if (document.activeElement && document.activeElement !== document.body && document.activeElement.blur) {
      document.activeElement.blur();
    }
  };
  // One press and release at a point, as a mouse would. A cancelled pointerdown suppresses the mouse events of
  // the press, but not the click.
  const press = (target, point, detail) => {
    const pointerDown = fire(target, 'pointerdown', pointerInit(point, { buttons: 1, pressure: 0.5 }));
    if (pointerDown && fire(target, 'mousedown', mouseInit(point, { buttons: 1, detail }))) focusFrom(target);
    fire(target, 'pointerup', pointerInit(point));
    if (pointerDown) fire(target, 'mouseup', mouseInit(point, { detail }));
    // Native media controls ignore clicks from scripts; a click on the media element plays or pauses it instead.
    const media = target.closest('audio[controls], video[controls]');
    if (fire(target, 'click', mouseInit(point, { detail })) && media && detail === 1) {
      if (media.paused) {
        try { const playing = media.play(); if (playing && playing.catch) playing.catch(() => undefined); } catch (error) { /* Refused. */ }
      } else {
        media.pause();
      }
    }
  };
  const clickAt = (target, point, count) => {
    moveOnto(target, point);
    press(target, point, 1);
    if (count === 2) {
      press(target, point, 2);
      fire(target, 'dblclick', mouseInit(point, { detail: 2 }));
    }
  };
  // A click from the keyboard: no pointer events, detail 0.
  const keyboardClick = element => fire(element, 'click', mouseInit(pointOf(element.getBoundingClientRect()), { detail: 0 }));

  // The innermost element at a point, also inside open shadow roots: a real press lands there, and the events are
  // composed, so the shadow host sees them too.
  const deepestAt = (hit, point) => {
    let current = hit;
    for (let depth = 0; current && current.shadowRoot && depth < 20; depth++) {
      const inner = current.shadowRoot.elementFromPoint(point.x, point.y);
      if (!inner || inner === current) break;
      current = inner;
    }
    return current;
  };
  // The element a pointer interaction lands on: { target, point } or a failure. A checkbox or radio button that is
  // hidden behind its label (custom-styled controls) is pressed through a visible label.
  const pointerTargetOf = (element, clipCache) => {
    const candidates = [element];
    if (element.labels) candidates.push(...Array.from(element.labels));
    let covering = null;
    for (const candidate of candidates) {
      const rect = visibleRectOf(candidate, clipCache);
      if (!rect || rect.width < 1 || rect.height < 1) continue;
      const point = pointOf(rect);
      const hit = document.elementFromPoint(point.x, point.y);
      if (hit && (hit === candidate || candidate.contains(hit))) return { target: deepestAt(hit, point), point, rect };
      if (hit && !covering) covering = hit;
    }
    return covering
      ? { failure: 'covered', message: 'Another element is on top of it.', coveredBy: covering }
      : { failure: 'not-visible', message: 'It is not visible.' };
  };
  // Scrolls an element into view inside this page only. scrollIntoView() would also scroll the host page and the
  // editor around the iframe, so every scroll container is scrolled by hand, ending with the page itself.
  const reveal = element => {
    const center = (rect, box) => ({
      x: rect.left < box.left || rect.right > box.right ? rect.left + rect.width / 2 - (box.left + box.right) / 2 : 0,
      y: rect.top < box.top || rect.bottom > box.bottom ? rect.top + rect.height / 2 - (box.top + box.bottom) / 2 : 0,
    });
    const root = document.scrollingElement || document.documentElement;
    for (let container = element.parentElement; container && container !== root && container !== document.documentElement; container = container.parentElement) {
      if (container === document.body && root === document.body) break;
      const style = getComputedStyle(container);
      if (style.overflowX === 'visible' && style.overflowY === 'visible') continue;
      if (container.scrollHeight <= container.clientHeight && container.scrollWidth <= container.clientWidth) continue;
      const outer = container.getBoundingClientRect();
      const left = outer.left + container.clientLeft;
      const top = outer.top + container.clientTop;
      const delta = center(element.getBoundingClientRect(), { left, top, right: left + container.clientWidth, bottom: top + container.clientHeight });
      if (delta.x) container.scrollLeft += delta.x;
      if (delta.y) container.scrollTop += delta.y;
    }
    const width = document.documentElement.clientWidth || window.innerWidth;
    const height = document.documentElement.clientHeight || window.innerHeight;
    const delta = center(element.getBoundingClientRect(), { left: 0, top: 0, right: width, bottom: height });
    if (delta.x) root.scrollLeft += delta.x;
    if (delta.y) root.scrollTop += delta.y;
  };
  const optionFor = (select, value) => {
    const options = Array.from(select.options);
    const label = option => (option.label || option.text || '').trim();
    return options.find(option => option.value === value)
      || options.find(option => label(option) === value.trim())
      || options.find(option => label(option).toLowerCase() === value.trim().toLowerCase())
      || null;
  };
  const setNativeValue = (element, value) => {
    const prototype = element.localName === 'textarea' ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
    const descriptor = Object.getOwnPropertyDescriptor(prototype, 'value');
    // The prototype's setter, so frameworks that wrap the element's own value property notice the change.
    if (descriptor && descriptor.set) descriptor.set.call(element, value);
    else element.value = value;
  };
  // Whether a field kept a value it was given, allowing for the normal forms fields bring values into: numbers are
  // clamped and stepped, colors lowercased, dates and times reformatted.
  const accepted = (element, value) => {
    const actual = element.value;
    if (actual === value) return true;
    if (value === '') return actual === '';
    if (actual === '') return false;
    const type = element.type;
    if (type === 'range' || type === 'number') return value.trim() !== '' && Number.isFinite(Number(value));
    if (type === 'color') return actual.toLowerCase() !== '#000000' || /^#0{3}(0{3})?$/i.test(value.trim()) || value.trim().toLowerCase() === 'black';
    return true;
  };
  const fill = (element, value) => {
    if (element.localName === 'select') {
      const option = optionFor(element, value);
      if (!option) {
        const names = Array.from(element.options).slice(0, MAX_OPTIONS).map(option => JSON.stringify(option.value || option.text)).join(', ');
        return { failure: 'invalid-value', message: 'It has no option ' + JSON.stringify(value) + '. Options: ' + names + '.' };
      }
      focusFrom(element);
      element.value = option.value;
      Array.from(element.options).forEach(candidate => { candidate.selected = candidate === option; });
      fireEvent(element, 'input');
      fireEvent(element, 'change');
      return null;
    }
    focusFrom(element);
    if (element.isContentEditable) {
      let inserted = false;
      if (document.hasFocus()) {
        try {
          const selection = window.getSelection();
          const range = document.createRange();
          range.selectNodeContents(element);
          selection.removeAllRanges();
          selection.addRange(range);
          // Fires beforeinput and input like typing would, and keeps the content's undo history.
          inserted = document.execCommand('insertText', false, value);
        } catch (error) { inserted = false; }
      }
      if (!inserted) {
        element.textContent = value;
        fireInput(element, value);
      }
      return null;
    }
    const previous = element.value;
    setNativeValue(element, value);
    if (!accepted(element, value)) {
      // Put the field back as it was: it fires no events, so the content still believes the old value.
      setNativeValue(element, previous);
      return { failure: 'invalid-value', message: 'It does not accept ' + JSON.stringify(value) + ' as a value of type "' + element.type + '".' };
    }
    fireInput(element, value);
    fireEvent(element, 'change');
    return null;
  };
  const MODIFIER_KEYS = { control: 'ctrlKey', ctrl: 'ctrlKey', shift: 'shiftKey', alt: 'altKey', option: 'altKey', meta: 'metaKey', command: 'metaKey', cmd: 'metaKey' };
  // Key names in any case, with the key codes legacy handlers read.
  const NAMED_KEYS = {
    enter: ['Enter', 13], return: ['Enter', 13], escape: ['Escape', 27], esc: ['Escape', 27], tab: ['Tab', 9],
    backspace: ['Backspace', 8], delete: ['Delete', 46], del: ['Delete', 46], insert: ['Insert', 45],
    space: [' ', 32], ' ': [' ', 32], spacebar: [' ', 32],
    arrowup: ['ArrowUp', 38], up: ['ArrowUp', 38], arrowdown: ['ArrowDown', 40], down: ['ArrowDown', 40],
    arrowleft: ['ArrowLeft', 37], left: ['ArrowLeft', 37], arrowright: ['ArrowRight', 39], right: ['ArrowRight', 39],
    home: ['Home', 36], end: ['End', 35], pageup: ['PageUp', 33], pagedown: ['PageDown', 34],
  };
  for (let index = 1; index <= 12; index++) NAMED_KEYS['f' + index] = ['F' + index, 111 + index];
  const CODES = { ' ': 'Space' };
  // "Control+Shift+K" → { key: 'K', code: 'KeyK', keyCode: 75, ctrlKey: true, shiftKey: true }. A lone "+" is the plus key.
  const parseKey = text => {
    const parts = text === '+' ? ['+'] : text.split('+');
    if (parts.length > 1 && parts[parts.length - 1] === '') { parts.pop(); parts[parts.length - 1] += '+'; }
    const init = { ctrlKey: false, shiftKey: false, altKey: false, metaKey: false };
    for (const part of parts.slice(0, -1)) {
      const modifier = MODIFIER_KEYS[part.trim().toLowerCase()];
      if (!modifier) return null;
      init[modifier] = true;
    }
    let key = parts[parts.length - 1];
    if (key.trim()) key = key.trim();
    if (!key) return null;
    let keyCode = 0;
    const named = Object.prototype.hasOwnProperty.call(NAMED_KEYS, key.toLowerCase()) ? NAMED_KEYS[key.toLowerCase()] : null;
    if (named) {
      key = named[0];
      keyCode = named[1];
    } else if (key.length !== 1) {
      return null;
    } else if (/^[a-z]$/i.test(key)) {
      key = init.shiftKey ? key.toUpperCase() : key.toLowerCase();
      keyCode = key.toUpperCase().charCodeAt(0);
    } else if (/^[0-9]$/.test(key)) {
      keyCode = key.charCodeAt(0);
    }
    let code = CODES[key] || (named ? key : '');
    if (/^[a-z]$/i.test(key)) code = 'Key' + key.toUpperCase();
    else if (/^[0-9]$/.test(key)) code = 'Digit' + key;
    return Object.assign(init, { key, code, keyCode, which: keyCode });
  };
  // Elements browsers activate on Enter or Space. Elements that only have a role handle keys themselves.
  const isActivatable = element => element.localName === 'button' || element.localName === 'summary'
    || (element.localName === 'a' && element.hasAttribute('href'))
    || (element.localName === 'input' && BUTTON_TYPES.has(element.type));
  // A key press on an element, with the default actions scripts can't trigger by dispatching key events:
  // Enter and Space activate buttons and links, arrow keys step range and number fields, Enter submits forms.
  const pressKey = (element, keyInit) => {
    const isControl = element.matches(FOCUSABLE_SELECTOR);
    if (isControl && document.hasFocus()) {
      try { element.focus({ preventScroll: true }); } catch (error) { /* Not focusable. */ }
    }
    const target = isControl ? element : (document.activeElement && element.contains(document.activeElement) ? document.activeElement : element);
    const init = Object.assign({ bubbles: true, cancelable: true, composed: true, view: window }, keyInit);
    const allowed = target.dispatchEvent(new KeyboardEvent('keydown', init));
    const printable = keyInit.key.length === 1 || keyInit.key === 'Enter';
    if (allowed && printable && !init.ctrlKey && !init.metaKey) {
      const charCode = keyInit.key === 'Enter' ? 13 : keyInit.key.charCodeAt(0);
      target.dispatchEvent(new KeyboardEvent('keypress', Object.assign({}, init, { charCode, keyCode: charCode, which: charCode })));
    }
    const modified = init.ctrlKey || init.metaKey || init.altKey;
    if (allowed && !modified) {
      const key = keyInit.key;
      const isStepper = target.localName === 'input' && (target.type === 'range' || target.type === 'number');
      if (key === 'Enter' && isActivatable(target) && !isNativeCheckable(target)) keyboardClick(target);
      else if (isStepper && (key === 'ArrowUp' || key === 'ArrowRight' || key === 'ArrowDown' || key === 'ArrowLeft')) {
        try {
          if (key === 'ArrowUp' || key === 'ArrowRight') target.stepUp(); else target.stepDown();
          fireInput(target, target.value);
          fireEvent(target, 'change');
        } catch (error) { /* Not steppable. */ }
      } else if (key === 'Enter' && target.form && target.localName === 'input') {
        try { target.form.requestSubmit(); } catch (error) { /* Invalid or sandboxed form. */ }
      }
    }
    const released = target.dispatchEvent(new KeyboardEvent('keyup', init));
    // Space activates on release.
    if (allowed && released && !modified && keyInit.key === ' ' && isActivatable(target) && target.localName !== 'a') keyboardClick(target);
  };
  // The closest element that can still scroll by a delta on one axis: the element itself, a scrolling ancestor, or
  // the page.
  const scrollerFor = (element, axis, delta) => {
    const canScroll = (candidate, overflowOk) => {
      if (!overflowOk) return false;
      const position = axis === 'y' ? candidate.scrollTop : candidate.scrollLeft;
      const max = axis === 'y' ? candidate.scrollHeight - candidate.clientHeight : candidate.scrollWidth - candidate.clientWidth;
      return delta > 0 ? position < max - 0.5 : position > 0.5;
    };
    const root = document.scrollingElement || document.documentElement;
    for (let current = element; current && current !== root && current !== document.documentElement; current = current.parentElement) {
      const style = getComputedStyle(current);
      if (canScroll(current, /(auto|scroll|overlay)/.test(axis === 'y' ? style.overflowY : style.overflowX))) return current;
    }
    return canScroll(root, true) ? root : null;
  };
  const scroll = (element, deltaX, deltaY) => {
    const rect = visibleRectOf(element, null) || element.getBoundingClientRect();
    if (!fire(element, 'wheel', mouseInit(pointOf(rect), { deltaX, deltaY, deltaMode: 0 }))) return null;
    let moved = false;
    for (const [axis, delta] of [['x', deltaX], ['y', deltaY]]) {
      if (!delta) continue;
      const scroller = scrollerFor(element, axis, delta);
      if (!scroller) continue;
      const property = axis === 'y' ? 'scrollTop' : 'scrollLeft';
      const before = scroller[property];
      scroller[property] = before + delta;
      if (scroller[property] !== before) moved = true;
    }
    // The content handled the wheel itself (it cancelled it) or something scrolled.
    return moved ? null : { failure: 'not-scrollable', message: 'Nothing under it can scroll in that direction.' };
  };

  const interactions = {
    click: { pointer: true, enabled: true },
    hover: { pointer: true, enabled: false },
    fill: { pointer: false, enabled: true },
    check: { pointer: true, enabled: true },
    press: { pointer: false, enabled: true },
    scroll: { pointer: false, enabled: false, hidden: true },
  };
  // Checks whether an interaction can be performed, after scrolling the element into view. Returns the pointer
  // target for pointer interactions, or a failure.
  const check = (element, interaction) => {
    const rules = interactions[interaction.type];
    if (!rules.hidden) {
      reveal(element);
      if (!visibleRectOf(element, null) && !(element.labels && Array.from(element.labels).some(label => visibleRectOf(label, null)))) {
        return { failure: 'not-visible', message: 'It is not visible: hidden, collapsed or outside the page.' };
      }
    }
    if (rules.enabled && isDisabled(element)) return { failure: 'disabled', message: 'It is disabled.' };
    if (interaction.type === 'fill') {
      if (!isFillable(element)) return { failure: 'not-editable', message: 'It is not a text field, select or editable element.' };
      if (element.readOnly === true) return { failure: 'not-editable', message: 'It is read-only.' };
    }
    if (interaction.type === 'check') {
      if (!isCheckable(element)) return { failure: 'not-checkable', message: 'It is not a checkbox, radio button or switch.' };
      if (interaction.checked === false && (element.type === 'radio' || roleOf(element) === 'radio' || roleOf(element) === 'menuitemradio') && checkedOf(element) === true) {
        return { failure: 'not-checkable', message: 'A radio button cannot be unchecked; check another option instead.' };
      }
    }
    if (interaction.type === 'press' && !parseKey(interaction.key)) {
      return { failure: 'invalid-value', message: 'Unknown key ' + JSON.stringify(interaction.key) + '. Use a key name such as "Enter", "Escape", "ArrowUp" or "a", optionally with modifiers such as "Control+a".' };
    }
    if (!rules.pointer) return {};
    return pointerTargetOf(element, null);
  };
  const perform = (element, interaction, pointer) => {
    switch (interaction.type) {
      case 'click':
        clickAt(pointer.target, pointer.point, interaction.count === 2 ? 2 : 1);
        return null;
      case 'hover':
        moveOnto(pointer.target, pointer.point);
        return null;
      case 'fill':
        return fill(element, interaction.value);
      case 'check':
        // Whether it changed is judged when the result is described: content often renders its new state later.
        if (checkedOf(element) !== (interaction.checked !== false)) clickAt(pointer.target, pointer.point, 1);
        return null;
      case 'press':
        pressKey(element, parseKey(interaction.key));
        return null;
      case 'scroll':
        return scroll(element, Number(interaction.deltaX) || 0, Number(interaction.deltaY) || 0);
    }
    return null;
  };
  const interact = message => {
    const requestId = message.requestId;
    const interaction = message.interaction && typeof message.interaction === 'object' ? message.interaction : {};
    const answer = (result, element) => {
      const reply = Object.assign({ type: MESSAGES.interactResult, requestId }, result);
      // The content may have replaced the element while reacting, e.g. by rendering again.
      const current = element && element.isConnected ? element : (queryAll(message.selector) || [])[0];
      if (current) reply.element = describe(current, true);
      if (message.trial !== true && interaction.type === 'check' && !reply.failure && (!current || checkedOf(current) !== (interaction.checked !== false))) {
        reply.failure = 'not-checkable';
        reply.message = 'Clicking it did not change whether it is checked.';
      }
      post(reply);
    };
    const elements = typeof message.selector === 'string' ? queryAll(message.selector) : null;
    if (!elements) {
      post({ type: MESSAGES.interactResult, requestId, failure: 'not-found', message: 'The selector is invalid.' });
      return;
    }
    if (!elements.length) {
      post({ type: MESSAGES.interactResult, requestId, failure: 'not-found', message: 'No element matches the selector.' });
      return;
    }
    if (!Object.prototype.hasOwnProperty.call(interactions, interaction.type)) {
      post({ type: MESSAGES.interactResult, requestId, failure: 'invalid-value', message: 'Unknown interaction.' });
      return;
    }
    const element = elements[0];
    let result;
    try {
      const checked = check(element, interaction);
      if (checked.failure) {
        result = { failure: checked.failure, message: checked.message };
        if (checked.coveredBy) result.coveredBy = describe(checked.coveredBy, false);
      } else if (message.trial === true) {
        result = {};
      } else {
        result = perform(element, interaction, checked) || {};
      }
    } catch (error) {
      // The content's handlers run inside dispatchEvent and report their own errors; this is the bridge failing.
      result = { failure: 'invalid-value', message: 'The interaction failed: ' + clip(String(error && error.message || error), MAX_TEXT) };
    }
    // Trials and refusals answer at once; the result of an interaction is described once the content had time to react.
    if (message.trial === true || result.failure) answer(result, element);
    else setTimeout(() => answer(result, element), SETTLE_MS);
  };

  window.addEventListener('message', event => {
    if (event.source !== host || !event.data || typeof event.data !== 'object') return;
    if (event.data.type === MESSAGES.sync) sync(event.data);
    else if (event.data.type === MESSAGES.query && isReady) query(event.data);
    else if (event.data.type === MESSAGES.interact && isReady) interact(event.data);
  });

  // Hover. Touch has no hover, so only mouse and pen pointers report it. The pointer of interactions is an agent's,
  // not the user's, so it is never reported.
  document.addEventListener('pointerover', event => {
    if (event.pointerType !== 'touch' && event.pointerId !== AGENT_POINTER_ID) setHovered(event.target);
  }, true);
  document.addEventListener('pointerout', event => {
    if (event.pointerType !== 'touch' && event.pointerId !== AGENT_POINTER_ID && !event.relatedTarget) setHovered(null);
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
    if (event.pointerId === AGENT_POINTER_ID) return;
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

  // The content's scripts have run once the document is parsed, so the host can query it from then on. Queries
  // that arrived earlier are sent again by the host when it gets 'ready'.
  const announceReady = () => {
    isReady = true;
    post({ type: MESSAGES.ready });
  };
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', announceReady, { once: true });
  } else {
    announceReady();
  }
})();`;
}
