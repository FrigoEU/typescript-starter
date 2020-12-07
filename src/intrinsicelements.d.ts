// https://github.com/DefinitelyTyped/DefinitelyTyped/blob/09d10b62b777a53de18067a2bb6b8bf68a73a758/types/react/v16/index.d.ts#L2993
declare namespace JSX {
  type IntrinsicElements = {
    // HTML
    [P in keyof HTMLElementTagNameMap]: { [attr: string]: any };
  };
  type Element = HTMLElement;
}
