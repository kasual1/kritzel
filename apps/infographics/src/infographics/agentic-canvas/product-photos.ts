/**
 * Product photos Claude can put into its pages: the red running shoe from the agentic landing page of the website.
 * Claude cannot see them, so each one comes with a description of what it shows.
 */
interface ProductPhoto {
  file: string;
  width: number;
  height: number;
  description: string;
}

const PRODUCT_PHOTOS: ProductPhoto[] = [
  {
    file: 'red-running-shoe.jpg',
    width: 846,
    height: 548,
    description:
      'The red running shoe, the hero product: a chunky low-top runner in off-white and pale grey mesh with glossy red ' +
      'overlays, cream laces wrapped loosely around the upper and a thick sculpted white sole. Side view, toe pointing right.',
  },
  {
    file: 'red-running-shoe-sock.jpg',
    width: 928,
    height: 1152,
    description:
      'The Sock variant: the same red-accented runner with a high beige knit sock collar instead of laces. Side view, portrait.',
  },
  {
    file: 'red-running-shoe-strap.jpg',
    width: 928,
    height: 1152,
    description: 'The Strap variant: the same runner with cut-out sides and a beige buckle strap across the instep. Side view, portrait.',
  },
];

/** Frames render from a srcdoc, so the photos are handed to Claude as absolute URLs. */
function toUrl(file: string): string {
  return new URL(`${import.meta.env.BASE_URL}products/${file}`, window.location.origin).href;
}

/** The part of the system prompt that lists the photos. */
export function describeProductPhotos(): string {
  return PRODUCT_PHOTOS.map(
    photo => `- ${toUrl(photo.file)} (${photo.width} × ${photo.height}): ${photo.description}`,
  ).join('\n');
}
