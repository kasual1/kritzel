/** A named easing curve or a custom easing function mapping progress `t ∈ [0, 1]` to eased progress. */
export type KritzelEasing = 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out' | ((t: number) => number);
