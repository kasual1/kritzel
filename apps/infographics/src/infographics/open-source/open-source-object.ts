import { KritzelDynamicObject } from '@kritzel/react-editor';

export function createOpenSourceObject(): KritzelDynamicObject {
  const element = document.createElement('div');
  element.style.width = '100%';
  element.style.height = '100%';
  // Outline of the open source keyhole logo as one pen stroke: outer ring from its lower-left end
  // clockwise over the top, up the right leg, counter-clockwise around the keyhole, down the left leg.
  element.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="7 7 186 182"
      width="100%" height="100%" role="img" aria-label="Open Source">
      <path fill="none" stroke="#4A7DFF" stroke-width="6"
        stroke-linecap="round" stroke-linejoin="round"
        d="M 71.4,185.3 A 90,90 0 1 1 128.6,185.3 L 108.7,127.6 A 28,28 0 1 0 91.3,127.6 Z" />
    </svg>`;

  return new KritzelDynamicObject({
    element,
    width: 320,
    height: 320 * 182 / 186,
    translateX: 0,
    translateY: 0,
  });
}
