// Small declaration for hyperscript typechecking

declare module "hyperscript" {
  interface HyperScript {
    /** Creates an Element */
    <T extends keyof ElementTagNameMap>(
      tagName: T,
      attrs?: Object,
      ...children: (null | string | number | HTMLElement)[]
    ): ElementTagNameMap[T];
    <T extends Element>(
      tagName: string,
      attrs?: Object,
      ...children: (null | string | number | HTMLElement)[]
    ): T;
    /** Cleans up any event handlers created by this hyperscript context */
    // cleanup(): void;
    /** Creates a new hyperscript context */
    // context(): HyperScript;
  }

  const h: HyperScript;
  export = h;
}
