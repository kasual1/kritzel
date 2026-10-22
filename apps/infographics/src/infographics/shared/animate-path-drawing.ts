/** Draws every path of the element in document order, like a pen writing it. */
export function animatePathDrawing(element: Element, totalDuration = 1350, startDelay = 100): void {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return;
  }

  const paths = Array.from(element.querySelectorAll('path'));
  const lengths = paths.map(path => path.getTotalLength());
  const totalLength = lengths.reduce((sum, length) => sum + length, 0);
  let delay = startDelay;

  paths.forEach((path, index) => {
    const length = lengths[index];
    const duration = totalDuration * length / totalLength;
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
