import { KritzelDynamicObject } from '@kritzel/react-editor';

export function createWelcomeObject(): KritzelDynamicObject {
  const element = document.createElement('div');
  element.style.width = '100%';
  element.style.height = '100%';
  element.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="18 29 253 72"
      width="100%" height="100%" role="img" aria-label="Welcome">
      <path fill="none" stroke="#4A7DFF" stroke-width="4"
        stroke-linecap="round" stroke-linejoin="round"
        d="M 20,34 C 21,30 25.5,29.9 26,35 C 28.1,55.9 24,98 30,98 C 36,98 45,72 52,54 C 51,74 52,98 58,98 C 66,98 77,62 83,34
           M 83,88 C 95,86 103.5,79.1 102,73 C 100.5,67.1 89.2,69.8 86,83 C 83.4,93.9 90,99.2 98,98 C 104,97.1 110.5,93.4 114,88 C 122.4,74.8 128.1,52 130,37 C 131,29 126.8,29 125,37 C 120.6,55.9 116.8,88.6 121,96 C 124.2,101.6 131.6,97.6 136,92 C 143.2,82.8 149,72.5 157,72 C 160,71.8 161,75 159,77 C 156,72 145.8,74.2 143,86 C 140.6,96.2 147.9,99.8 154,98 C 158,96.8 162.8,93.6 165,90 C 170.4,81 174,72 181,72 C 188,72 189.7,82.3 185,92 C 181.5,99.3 172,100 171,92 C 170,84 177,73 185,73 C 189,73 193,73 197,72 C 197,80 196,92 194,98 C 199,82 204,72 210,72 C 215,72 215,82 211,98 C 216,82 221,72 227,72 C 232,72 232.4,84.1 229,94 C 227.2,99.1 230.8,99.7 235,97 C 243.6,91.4 256,86 256,77 C 256,70 244,69.7 241,82 C 238.1,93.8 245,99.2 253,98 C 259,97.1 265,94 269,90" />
    </svg>`;

  // Separate the pen lifts so dash animations reveal each stroke in writing order.
  const path = element.querySelector('path')!;
  const strokes = path.getAttribute('d')!.trim().split(/\s+(?=M )/);
  path.setAttribute('d', strokes[0]);
  for (const stroke of strokes.slice(1)) {
    const nextPath = path.cloneNode(true) as SVGPathElement;
    nextPath.setAttribute('d', stroke);
    path.parentNode!.appendChild(nextPath);
  }

  return new KritzelDynamicObject({
    element,
    width: 480,
    height: 480 * 72 / 253,
    translateX: 0,
    translateY: 0,
  });
}

export function animateWelcomeObject(object: Pick<KritzelDynamicObject, 'element'>): void {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return;
  }

  const paths = Array.from(object.element.querySelectorAll('path'));
  const lengths = paths.map(path => path.getTotalLength());
  const totalLength = lengths.reduce((sum, length) => sum + length, 0);
  let delay = 100;

  paths.forEach((path, index) => {
    const length = lengths[index];
    const duration = 1350 * length / totalLength;
    // Web Animations are transient: serialized HTML always contains the complete drawing.
    path.animate([
      { strokeDasharray: `${length} ${length}`, strokeDashoffset: length, opacity: 0 },
      { strokeDasharray: `${length} ${length}`, strokeDashoffset: length, opacity: 1, offset: 0.001 },
      { strokeDasharray: `${length} ${length}`, strokeDashoffset: 0, opacity: 1 },
    ], {
      duration,
      delay,
      easing: 'linear',
      fill: 'backwards',
    });
    delay += duration + 50;
  });
}
