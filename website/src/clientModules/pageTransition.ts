import type { Location } from 'history';

/**
 * Docusaurus client module: re-triggers the page fade animation after the
 * route's DOM has been updated (fires reliably after lazy-loaded pages render).
 */
export function onRouteDidUpdate({
  location,
  previousLocation,
}: {
  location: Location;
  previousLocation: Location | null;
}): void {
  if (!previousLocation || location.pathname === previousLocation.pathname) {
    return;
  }
  // .main-wrapper spans everything between navbar and footer (incl. page heroes rendered outside <main>)
  const wrapper = document.querySelector<HTMLElement>('#__docusaurus .main-wrapper');
  if (!wrapper) {
    return;
  }
  wrapper.classList.remove('page-fade-in');
  void wrapper.offsetWidth; // force reflow so the animation restarts
  wrapper.classList.add('page-fade-in');
}
