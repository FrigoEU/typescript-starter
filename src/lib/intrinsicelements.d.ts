// Some declarations to help typescript typecheck JSX / TSX files
// See:
// https://www.typescriptlang.org/docs/handbook/jsx.html
// and
// https://github.com/DefinitelyTyped/DefinitelyTyped/blob/09d10b62b777a53de18067a2bb6b8bf68a73a758/types/react/v16/index.d.ts#L2993
declare namespace JSX {
  interface ElementChildrenAttribute {
    children: {}; // specify children name to use
  }
  type Child = string | number | HTMLElement | Child[];
  type IntrinsicElements = {
    // HTML
    [P in keyof HTMLElementTagNameMap]: {
      [attr: string]: any;
      children?: Child;
    };
  };
  type Element = HTMLElement;
}
