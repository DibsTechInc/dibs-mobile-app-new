/**
 * `@studio/hero` — this build's studio hero photograph, resolved by Metro (`metro.config.js`).
 *
 * A module declaration rather than a `paths` entry in tsconfig, deliberately: a path mapping
 * would have to name one studio's directory and one file extension, which puts a studio slug in
 * a config file that is supposed to be studio-agnostic — and the extension genuinely varies
 * between studios. TypeScript only needs to know the SHAPE of what comes back; Metro decides
 * which file that is at bundle time, from `studio.json`.
 *
 * `number` is what React Native's asset registry returns from a `require` of an image.
 */
declare module '@studio/hero' {
  const asset: number;
  export default asset;
}

/** `@studio/logo` — this build's studio logo. Same contract and rationale as `@studio/hero`. */
declare module '@studio/logo' {
  const asset: number;
  export default asset;
}
