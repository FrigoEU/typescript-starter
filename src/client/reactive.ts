import h from "hyperscript";

export function active<Props>(c: Component<Props>, p: Props): HTMLElement {
  if (typeof window === "undefined") {
    // serverside: stringify into template
    return h(c.name, {}, h("template", {}, JSON.stringify(p)));
  } else {
    // clientside: pass as prop on custom element
    const a: HTMLElement = h(c.name, {}, null);
    (a as any).props = p;
    return a;
  }
}

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

// Needed to keep track of sources so we can
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

  return {
    Source: ServersideSource,
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

export function registerOnClientGeneric<ConstProps>(
  c: Component<ConstProps>
): void {
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

export type Component<ConstProps> = {
  name: string;
  run: (p: Immutable<ConstProps>) => HTMLElement;
};

// TODO check for memory leaks?
export function dyn<T>(
  s: Source<T>,
  render: (v: T) => HTMLElement
): HTMLElement {
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
