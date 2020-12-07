import h from "hyperscript";
import {
  Component,
  Source,
  dyn,
  active,
  registerOnClientGeneric,
} from "./reactive";

// still TODO:
// name in Component = anonymous component (?)
// dyn on server (= anonymous (?))
// registerOnClient
// firefox heeft coole tooling om je naar definitie van custom element te brengen -> kunnen we dat gebruiken?

export const countershower: Component<{ counter: Source<number> }> = {
  name: "my-countershower",
  run: function (c) {
    return dyn(c.counter, (count) => <span>{count}</span>);
  },
};

export const countershower2: Component<{ counter: Source<number> }> = {
  name: "my-countershower2",
  run: function (c) {
    return (
      <div>
        {dyn(c.counter, (count) => (
          <span>{count}</span>
        ))}
      </div>
    );
  },
};

export const counterbutton: Component<{ counter: Source<number> }> = {
  name: "my-counterbutton",
  run: (c) => (
    <button onclick={() => c.counter.set(c.counter.get() + 1)}>one up</button>
  ),
};

export const myfleeflers: Component<{ something: string }> = {
  name: "my-fleeflers",
  run: function (c) {
    const mysource = new Source(0);
    /* setInterval(function () {
     *   mysource.set(mysource.get() + 1);
     * }, 1000); */
    return h("div", {}, [
      "fleeflers: " + c.something,
      dyn(mysource, function (val: number): HTMLElement {
        return h("span", {}, val.toString());
      }),
    ]);
  },
};

export const mybleebers: Component<{ content: Source<string> }> = {
  name: "my-bleebers",
  run: function (c) {
    return h("div", {}, [
      "bleebers: " + c.content.get(),
      active(myfleeflers, { something: "wack" }),
    ]);
  },
};

const w: any = typeof window === "undefined" ? {} : window;
w.registerOnClient = function () {
  registerOnClientGeneric(mybleebers);
  registerOnClientGeneric(myfleeflers);
  registerOnClientGeneric(countershower);
  registerOnClientGeneric(counterbutton);
  registerOnClientGeneric(countershower2);
};
