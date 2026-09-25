// Components are registered on demand by the generated proxies (dist-custom-elements build).
// Calling the lazy loader from '@kritzel/engine/loader' here would register a second,
// lazy-loaded `kritzel-engine` that wins the race against the editor's bundled one.
export const ComponentLibrary: any = {
  install() {},
};
