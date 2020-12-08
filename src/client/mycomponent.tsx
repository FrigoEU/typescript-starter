import h from "hyperscript";
import { Source, dyn, active, component, Component } from "./reactive";

// still TODO:
// name in Component = anonymous component (?)
// dyn on server: Gaat niet. Clientside code moet apart gecompileerd worden. Het enige wat soms zou lukken is de code van de dyn zelf serializen, maar je krijgt de closure niet mee dus je hebt heel rare semantics
// firefox heeft coole tooling om je naar definitie van custom element te brengen -> kunnen we dat gebruiken?

export const countershower: Component<{ counter: Source<number> }> = component(
  "my-countershower",
  function (c) {
    return dyn(c.counter, (count) => <span>{count}</span>);
  }
);

export const countershower2: Component<{ counter: Source<number> }> = component(
  "my-countershower2",
  function (c) {
    return (
      <div>
        {dyn(c.counter, (count) => (
          <span>{count}</span>
        ))}
      </div>
    );
  }
);

export const counterbutton: Component<{
  counter: Source<number>;
}> = component("my-counterbutton", (c) => (
  <button onclick={() => c.counter.set(c.counter.get() + 1)}>one up</button>
));

export const myfleeflers: Component<{ something: string }> = component(
  "my-fleeflers",
  function (c) {
    const mysource = new Source(0);
    setInterval(function () {
      mysource.set(mysource.get() + 1);
    }, 1000);
    return (
      <div>
        fleeflers: {c.something}
        {dyn(mysource, function (val: number): HTMLElement {
          return h("span", {}, val.toString());
        })}
      </div>
    );
  }
);

export const mybleebers: Component<{ content: string }> = component(
  "my-bleebers",
  function (c) {
    return (
      <div>
        bleebers: {c.content}
        {active(myfleeflers, { something: "wack" })}
      </div>
    );
  }
);
