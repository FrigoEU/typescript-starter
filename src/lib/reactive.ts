import h from "hyperscript";

function findNonSerializable(obj: any): any | null {
  function isPlain(val: any) {
    return (
      typeof val === "undefined" ||
      typeof val === "string" ||
      typeof val === "boolean" ||
      typeof val === "number" ||
      Array.isArray(val) ||
      (val.constructor === Object && // don't allow classes or functions
        val.toString() === "[object Object]")
    );
  }
  // Special casing ServersideSource: We CAN serialize this from server to client,
  //   as long as the value itself is serializable (ie. not a function or class)
  if (obj.tag === "ServersideSource") {
    const nonSerializableVal = findNonSerializable(obj.value);
    if (nonSerializableVal) {
      return nonSerializableVal;
    } else {
      return null;
    }
  }
  if (!isPlain(obj)) {
    return obj;
  }
  if (Array.isArray(obj) || typeof obj === "object") {
    for (var property in obj) {
      if (obj.hasOwnProperty(property)) {
        const nonSerializableNested = findNonSerializable(obj[property]);
        if (nonSerializableNested) {
          return nonSerializableNested;
        }
      }
    }
  }
}

function errPrintFunction(f: Function): string {
  return `
Function name: ${f.name}
Function body: ${f.toString()}.

Wrap this in another component so function definition happens on client side.
`;
}

// function to initialize an instance of a component that needs to be rendered clientside
// when called serverside:
//   render into a custom element + a template inside.
//   clientside initialization (registerOnClient) knows to look for these template elements
// when called clientside:
//   render as custom element and set props on custom element
//   registerOnClient knows to look on .props attribute
export function active<Props>(c: Component<Props>, p: Props): HTMLElement {
  if (typeof window === "undefined") {
    // serverside: stringify into template
    if (process.env.NODE_ENV === "production") {
      // in production: don't check anything, following check is rather expensive
    } else {
      debugger;
      // in development: make sure everything is serializable
      const nonSerializable: any = findNonSerializable(p);
      if (nonSerializable) {
        throw new Error(
          `During serialization of properties for component ${c.name}.
Can't serialize on serverside:
${
  typeof nonSerializable === "function"
    ? errPrintFunction(nonSerializable)
    : JSON.stringify(nonSerializable)
}`
        );
      }
    }
    return h(c.name, {}, h("template", {}, JSON.stringify(p)));
  } else {
    // clientside: pass as prop on custom element
    const a: HTMLElement = h(c.name, {}, null);
    (a as any).props = p;
    return a;
  }
}

// Basic type of (clientside) dynamic values = values that can change over time
export interface Source<T> {
  get(): T;
  set(newval: T): void;
  observe(f: (currentVal: T, unsub: () => void) => void): void;
}

// Only clientside! Serverside: use initServersideSources
export const Source = class ClientSource<T> implements Source<T> {
  private value: T;
  private observers: ((currentVal: T, unsub: () => void) => void)[];

  constructor(value: T) {
    if (typeof window === "undefined") {
      throw new Error("Don't use this serverside, use initServersideSources.");
    }
    this.value = value;
    this.observers = [];
  }
  get(): T {
    return this.value;
  }
  set(newval: T): void {
    this.value = newval;
    const observersToRemove: number[] = [];
    this.observers.forEach(function (obs, i) {
      obs(newval, () => observersToRemove.push(i));
    }, null);
    observersToRemove.reverse().forEach((i) => {
      this.observers.splice(i, 1);
    });
  }
  observe(f: (currentVal: T, unsub: () => void) => void): void {
    this.observers.push(f);
  }
};

// We dynamically make a new class in this function, so we can keep
// track of every source that was made during serverside render
// and we can serialize them into the page with a single function = genServersideHeader
export function initServersideSources() {
  if (typeof window !== "undefined") {
    throw new Error("Only usable on server side!");
  }

  class ServersideSource<T> implements Source<T> {
    private i: number;
    private static genned: boolean = false;
    private static sourceI = 0;
    // Used to serialize all made sources into window.sources
    private static sources: { [key: string]: ServersideSource<any> } = {};

    private value: T;
    tag: string = "ServersideSource";
    static genServersideHeader() {
      ServersideSource.genned = true;
      const sourceAssignments = Object.keys(ServersideSource.sources)
        .map(function (key) {
          return `\"${key}\": ${JSON.stringify(ServersideSource.sources[key].get())}`;
        })
        .join(",");
      return h(
        "script",
        {},
        `window.sources = JSON.parse('{${sourceAssignments}}');`
      );
    }
    constructor(value: T) {
      if (ServersideSource.genned) {
        throw new Error(
          "Serverside header already generated, can't make new sources anymore!"
        );
      }
      this.value = value;
      this.i = ServersideSource.sourceI;
      ServersideSource.sourceI = ServersideSource.sourceI + 1;

      ServersideSource.sources[this.i] = this;
    }
    get(): T {
      return this.value;
    }
    set(v: T): void {
      if (ServersideSource.genned) {
        throw new Error(
          "Serverside header already generated, can't set source anymore!"
        );
      }
      this.value = v;
    }
    observe(): void {}
    toJSON(): Object {
      return {
        tag: "source",
        i: this.i,
      };
    }
  }

  function mkSource<T>(a: T) {
    return new ServersideSource(a);
  }

  return {
    Source: ServersideSource,
    mkSource: mkSource,
  };
}

// Used clientside to lookup sources from server
const sourcesFromServer: { [key: string]: Source<any> } = (function () {
  const w =
    typeof window === "undefined" ? (undefined as any) : (window as any);
  if (typeof w === "undefined") {
    return {};
  } else {
    Object.keys(w.sources).forEach(function (key) {
      w.sources[key] = new Source(w.sources[key]);
    });
    return w.sources;
  }
})();

function findSourcesFromServer(_: any, x: any) {
  if (
    typeof x === "object" &&
    typeof x.tag !== "undefined" &&
    x.tag === "source" &&
    typeof x.i !== "undefined"
  ) {
    const found = sourcesFromServer[x.i];
    if (!found) {
      throw new Error(
        "Source from server not found for i: " +
          x.i +
          ". Did you generate the header script with .genServersideHeader()?"
      );
    } else {
      return found;
    }
  }
  return x;
}

// Main function to hook up input props to components
function registerOnClient<ConstProps>(c: Component<ConstProps>): void {
  customElements.define(
    c.name,
    class extends HTMLElement {
      constructor() {
        super();
      }
      connectedCallback() {
        const root = this.attachShadow({ mode: "open" });
        if (
          this.children[0] &&
          this.children[0].tagName.toUpperCase() === "TEMPLATE"
        ) {
          // Comes from serverside = everything is serialized into a <template>
          const templ = this.children[0] as HTMLTemplateElement;
          const data: ConstProps = JSON.parse(
            templ.content.textContent || "",
            findSourcesFromServer
          );

          root.append(c.run(data as Immutable<ConstProps>));
        } else {
          // Comes from clientside = everything is added to a "props" property
          root.append(c.run((this as any).props as Immutable<ConstProps>));
        }
      }
    }
  );
}

export type Immutable<T> = T extends
  | Function
  | boolean
  | number
  | string
  | null
  | undefined
  ? T
  : T extends Array<infer U>
  ? ReadonlyArray<Immutable<U>>
  : T extends Map<infer K, infer V>
  ? ReadonlyMap<Immutable<K>, Immutable<V>>
  : T extends Set<infer S>
  ? ReadonlySet<Immutable<S>>
  : { readonly [P in keyof T]: Immutable<T[P]> };

// Function to define a new component
// Takes care of registering custom element with browser if on client side
// Asks for immutable properties, so it's clear that changing them will not
// update the view
export type Component<Props> = {
  name: string;
  run: (p: Immutable<Props>) => HTMLElement;
};
export function component<Props>(
  name: string,
  run: (p: Immutable<Props>) => HTMLElement
): Component<Props> {
  const comp = { name, run };
  if (typeof window !== "undefined") {
    registerOnClient(comp);
  }
  return comp;
}

// Client side only function of making an HTML fragment that can change
// based on the value of a source
//
// TODO memory leaks?
export function dyn<T>(
  s: Source<T>,
  render: (v: T) => HTMLElement
): HTMLElement {
  if (typeof window === "undefined") {
    throw new Error(
      "Can't use dyn on clientside. Wrap code in a component and use active instead."
    );
  }
  const currv = s.get();
  let el = render(currv);
  s.observe(function (newv, unsubscribe) {
    let newel = render(newv);
    const p = el.parentNode;
    if (p && p.isConnected) {
      p.replaceChild(newel, el);
      el = newel;
    } else {
      console.log("Unsubscribing");
      unsubscribe();
    }
  });
  return el;
}
