/**
 * Four jazz cover versions of "Full Control" by Luca Moulin Beau, as PNG images in public/covers. The first, "Tilted",
 * is the cover of the music player in the generative UI infographic. Their sources are the SVG files in covers/; after
 * changing one, run `npm run covers -w apps/infographics` to render the PNGs again.
 */
export interface AlbumCover {
  name: string;
  /**
   * Absolute URL of the PNG. The covers are shown inside iframe objects, whose pages are srcdoc documents, so the URL
   * must not depend on the page's own location.
   */
  image: string;
}

export function coverImage(file: string): string {
  return new URL(`${import.meta.env.BASE_URL}covers/${file}`, window.location.href).href;
}

export const ALBUM_COVERS: AlbumCover[] = [
  { name: 'Tilted', image: coverImage('tilted.png') },
  { name: 'Piano keys', image: coverImage('piano-keys.png') },
  { name: 'Vinyl', image: coverImage('vinyl.png') },
  { name: 'Microphone', image: coverImage('microphone.png') },
];
