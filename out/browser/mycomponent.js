(() => {
  var __create = Object.create;
  var __defProp = Object.defineProperty;
  var __getProtoOf = Object.getPrototypeOf;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __markAsModule = (target) => __defProp(target, "__esModule", {value: true});
  var __commonJS = (callback, module) => () => {
    if (!module) {
      module = {exports: {}};
      callback(module.exports, module);
    }
    return module.exports;
  };
  var __exportStar = (target, module, desc) => {
    __markAsModule(target);
    if (module && typeof module === "object" || typeof module === "function") {
      for (let key of __getOwnPropNames(module))
        if (!__hasOwnProp.call(target, key) && key !== "default")
          __defProp(target, key, {get: () => module[key], enumerable: !(desc = __getOwnPropDesc(module, key)) || desc.enumerable});
    }
    return target;
  };
  var __toModule = (module) => {
    if (module && module.__esModule)
      return module;
    return __exportStar(__defProp(module != null ? __create(__getProtoOf(module)) : {}, "default", {value: module, enumerable: true}), module);
  };

  // node_modules/browser-split/index.js
  var require_browser_split = __commonJS((exports, module) => {
    /*!
     * Cross-Browser Split 1.1.1
     * Copyright 2007-2012 Steven Levithan <stevenlevithan.com>
     * Available under the MIT License
     * ECMAScript compliant, uniform cross-browser split method
     */
    module.exports = function split(undef) {
      var nativeSplit = String.prototype.split, compliantExecNpcg = /()??/.exec("")[1] === undef, self;
      self = function(str, separator, limit) {
        if (Object.prototype.toString.call(separator) !== "[object RegExp]") {
          return nativeSplit.call(str, separator, limit);
        }
        var output = [], flags = (separator.ignoreCase ? "i" : "") + (separator.multiline ? "m" : "") + (separator.extended ? "x" : "") + (separator.sticky ? "y" : ""), lastLastIndex = 0, separator = new RegExp(separator.source, flags + "g"), separator2, match, lastIndex, lastLength;
        str += "";
        if (!compliantExecNpcg) {
          separator2 = new RegExp("^" + separator.source + "$(?!\\s)", flags);
        }
        limit = limit === undef ? -1 >>> 0 : limit >>> 0;
        while (match = separator.exec(str)) {
          lastIndex = match.index + match[0].length;
          if (lastIndex > lastLastIndex) {
            output.push(str.slice(lastLastIndex, match.index));
            if (!compliantExecNpcg && match.length > 1) {
              match[0].replace(separator2, function() {
                for (var i = 1; i < arguments.length - 2; i++) {
                  if (arguments[i] === undef) {
                    match[i] = undef;
                  }
                }
              });
            }
            if (match.length > 1 && match.index < str.length) {
              Array.prototype.push.apply(output, match.slice(1));
            }
            lastLength = match[0].length;
            lastLastIndex = lastIndex;
            if (output.length >= limit) {
              break;
            }
          }
          if (separator.lastIndex === match.index) {
            separator.lastIndex++;
          }
        }
        if (lastLastIndex === str.length) {
          if (lastLength || !separator.test("")) {
            output.push("");
          }
        } else {
          output.push(str.slice(lastLastIndex));
        }
        return output.length > limit ? output.slice(0, limit) : output;
      };
      return self;
    }();
  });

  // node_modules/indexof/index.js
  var require_indexof = __commonJS((exports, module) => {
    var indexOf = [].indexOf;
    module.exports = function(arr, obj) {
      if (indexOf)
        return arr.indexOf(obj);
      for (var i = 0; i < arr.length; ++i) {
        if (arr[i] === obj)
          return i;
      }
      return -1;
    };
  });

  // node_modules/class-list/index.js
  var require_class_list = __commonJS((exports, module) => {
    var indexof = require_indexof();
    module.exports = ClassList;
    function ClassList(elem) {
      var cl = elem.classList;
      if (cl) {
        return cl;
      }
      var classList = {
        add,
        remove,
        contains,
        toggle,
        toString: $toString,
        length: 0,
        item
      };
      return classList;
      function add(token) {
        var list = getTokens();
        if (indexof(list, token) > -1) {
          return;
        }
        list.push(token);
        setTokens(list);
      }
      function remove(token) {
        var list = getTokens(), index = indexof(list, token);
        if (index === -1) {
          return;
        }
        list.splice(index, 1);
        setTokens(list);
      }
      function contains(token) {
        return indexof(getTokens(), token) > -1;
      }
      function toggle(token) {
        if (contains(token)) {
          remove(token);
          return false;
        } else {
          add(token);
          return true;
        }
      }
      function $toString() {
        return elem.className;
      }
      function item(index) {
        var tokens = getTokens();
        return tokens[index] || null;
      }
      function getTokens() {
        var className = elem.className;
        return filter(className.split(" "), isTruthy);
      }
      function setTokens(list) {
        var length = list.length;
        elem.className = list.join(" ");
        classList.length = length;
        for (var i = 0; i < list.length; i++) {
          classList[i] = list[i];
        }
        delete list[length];
      }
    }
    function filter(arr, fn) {
      var ret = [];
      for (var i = 0; i < arr.length; i++) {
        if (fn(arr[i]))
          ret.push(arr[i]);
      }
      return ret;
    }
    function isTruthy(value) {
      return !!value;
    }
  });

  // empty:/home/simon/projects/typescript-starter/node_modules/html-element/index.js
  var require_html_element = __commonJS(() => {
  });

  // node_modules/hyperscript/index.js
  var require_hyperscript = __commonJS((exports, module) => {
    var split = require_browser_split();
    var ClassList = require_class_list();
    var w = typeof window === "undefined" ? require_html_element() : window;
    var document = w.document;
    var Text = w.Text;
    function context() {
      var cleanupFuncs = [];
      function h4() {
        var args = [].slice.call(arguments), e = null;
        function item(l) {
          var r;
          function parseClass(string) {
            var m = split(string, /([\.#]?[^\s#.]+)/);
            if (/^\.|#/.test(m[1]))
              e = document.createElement("div");
            forEach(m, function(v2) {
              var s2 = v2.substring(1, v2.length);
              if (!v2)
                return;
              if (!e)
                e = document.createElement(v2);
              else if (v2[0] === ".")
                ClassList(e).add(s2);
              else if (v2[0] === "#")
                e.setAttribute("id", s2);
            });
          }
          if (l == null)
            ;
          else if (typeof l === "string") {
            if (!e)
              parseClass(l);
            else
              e.appendChild(r = document.createTextNode(l));
          } else if (typeof l === "number" || typeof l === "boolean" || l instanceof Date || l instanceof RegExp) {
            e.appendChild(r = document.createTextNode(l.toString()));
          } else if (isArray(l))
            forEach(l, item);
          else if (isNode(l))
            e.appendChild(r = l);
          else if (l instanceof Text)
            e.appendChild(r = l);
          else if (typeof l === "object") {
            for (var k in l) {
              if (typeof l[k] === "function") {
                if (/^on\w+/.test(k)) {
                  (function(k2, l2) {
                    if (e.addEventListener) {
                      e.addEventListener(k2.substring(2), l2[k2], false);
                      cleanupFuncs.push(function() {
                        e.removeEventListener(k2.substring(2), l2[k2], false);
                      });
                    } else {
                      e.attachEvent(k2, l2[k2]);
                      cleanupFuncs.push(function() {
                        e.detachEvent(k2, l2[k2]);
                      });
                    }
                  })(k, l);
                } else {
                  e[k] = l[k]();
                  cleanupFuncs.push(l[k](function(v2) {
                    e[k] = v2;
                  }));
                }
              } else if (k === "style") {
                if (typeof l[k] === "string") {
                  e.style.cssText = l[k];
                } else {
                  for (var s in l[k])
                    (function(s2, v2) {
                      if (typeof v2 === "function") {
                        e.style.setProperty(s2, v2());
                        cleanupFuncs.push(v2(function(val) {
                          e.style.setProperty(s2, val);
                        }));
                      } else
                        var match = l[k][s2].match(/(.*)\W+!important\W*$/);
                      if (match) {
                        e.style.setProperty(s2, match[1], "important");
                      } else {
                        e.style.setProperty(s2, l[k][s2]);
                      }
                    })(s, l[k][s]);
                }
              } else if (k === "attrs") {
                for (var v in l[k]) {
                  e.setAttribute(v, l[k][v]);
                }
              } else if (k.substr(0, 5) === "data-") {
                e.setAttribute(k, l[k]);
              } else {
                e[k] = l[k];
              }
            }
          } else if (typeof l === "function") {
            var v = l();
            e.appendChild(r = isNode(v) ? v : document.createTextNode(v));
            cleanupFuncs.push(l(function(v2) {
              if (isNode(v2) && r.parentElement)
                r.parentElement.replaceChild(v2, r), r = v2;
              else
                r.textContent = v2;
            }));
          }
          return r;
        }
        while (args.length)
          item(args.shift());
        return e;
      }
      h4.cleanup = function() {
        for (var i = 0; i < cleanupFuncs.length; i++) {
          cleanupFuncs[i]();
        }
        cleanupFuncs.length = 0;
      };
      return h4;
    }
    var h3 = module.exports = context();
    h3.context = context;
    function isNode(el) {
      return el && el.nodeName && el.nodeType;
    }
    function forEach(arr, fn) {
      if (arr.forEach)
        return arr.forEach(fn);
      for (var i = 0; i < arr.length; i++)
        fn(arr[i], i);
    }
    function isArray(arr) {
      return Object.prototype.toString.call(arr) == "[object Array]";
    }
  });

  // src/client/mycomponent.tsx
  var import_hyperscript2 = __toModule(require_hyperscript());

  // src/lib/reactive.ts
  var import_hyperscript = __toModule(require_hyperscript());
  function findNonSerializable(obj) {
    function isPlain(val) {
      return typeof val === "undefined" || typeof val === "string" || typeof val === "boolean" || typeof val === "number" || Array.isArray(val) || val.constructor === Object && val.toString() === "[object Object]";
    }
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
  function errPrintFunction(f) {
    return `
Function name: ${f.name}
Function body: ${f.toString()}.

Wrap this in another component so function definition happens on client side.
`;
  }
  function active(c, p) {
    if (typeof window === "undefined") {
      if (false) {
      } else {
        debugger;
        const nonSerializable = findNonSerializable(p);
        if (nonSerializable) {
          throw new Error(`During serialization of properties for component ${c.name}.
Can't serialize on serverside:
${typeof nonSerializable === "function" ? errPrintFunction(nonSerializable) : JSON.stringify(nonSerializable)}`);
        }
      }
      return import_hyperscript.default(c.name, {}, import_hyperscript.default("template", {}, JSON.stringify(p)));
    } else {
      const a = import_hyperscript.default(c.name, {}, null);
      a.props = p;
      return a;
    }
  }
  var Source = class ClientSource {
    constructor(value) {
      if (typeof window === "undefined") {
        throw new Error("Don't use this serverside, use initServersideSources.");
      }
      this.value = value;
      this.observers = [];
    }
    get() {
      return this.value;
    }
    set(newval) {
      this.value = newval;
      const observersToRemove = [];
      this.observers.forEach(function(obs, i) {
        obs(newval, () => observersToRemove.push(i));
      }, null);
      observersToRemove.reverse().forEach((i) => {
        this.observers.splice(i, 1);
      });
    }
    observe(f) {
      this.observers.push(f);
    }
  };
  var sourcesFromServer = function() {
    const w = typeof window === "undefined" ? void 0 : window;
    if (typeof w === "undefined") {
      return {};
    } else {
      Object.keys(w.sources).forEach(function(key) {
        w.sources[key] = new Source(w.sources[key]);
      });
      return w.sources;
    }
  }();
  function findSourcesFromServer(_, x) {
    if (typeof x === "object" && typeof x.tag !== "undefined" && x.tag === "source" && typeof x.i !== "undefined") {
      const found = sourcesFromServer[x.i];
      if (!found) {
        throw new Error("Source from server not found for i: " + x.i + ". Did you generate the header script with .genServersideHeader()?");
      } else {
        return found;
      }
    }
    return x;
  }
  function registerOnClient(c) {
    customElements.define(c.name, class extends HTMLElement {
      constructor() {
        super();
      }
      connectedCallback() {
        const root = this.attachShadow({mode: "open"});
        if (this.children[0] && this.children[0].tagName.toUpperCase() === "TEMPLATE") {
          const templ = this.children[0];
          const data = JSON.parse(templ.content.textContent || "", findSourcesFromServer);
          root.append(c.run(data));
        } else {
          root.append(c.run(this.props));
        }
      }
    });
  }
  function component(name, run) {
    const comp = {name, run};
    if (typeof window !== "undefined") {
      registerOnClient(comp);
    }
    return comp;
  }
  function dyn(s, render) {
    if (typeof window === "undefined") {
      throw new Error("Can't use dyn on clientside. Wrap code in a component and use active instead.");
    }
    const currv = s.get();
    let el = render(currv);
    s.observe(function(newv, unsubscribe) {
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

  // src/client/mycomponent.tsx
  var countershower = component("my-countershower", function(c) {
    return dyn(c.counter, (count) => /* @__PURE__ */ import_hyperscript2.default("span", null, count));
  });
  var countershower2 = component("my-countershower2", function(c) {
    return /* @__PURE__ */ import_hyperscript2.default("div", null, dyn(c.counter, (count) => /* @__PURE__ */ import_hyperscript2.default("span", null, count)));
  });
  var counterbutton = component("my-counterbutton", (c) => /* @__PURE__ */ import_hyperscript2.default("button", {
    onclick: () => c.counter.set(c.counter.get() + 1)
  }, "one up"));
  var myfleeflers = component("my-fleeflers", function(c) {
    const mysource = new Source(0);
    setInterval(function() {
      mysource.set(mysource.get() + 1);
    }, 1e3);
    return /* @__PURE__ */ import_hyperscript2.default("div", null, "fleeflers: ", c.something, dyn(mysource, function(val) {
      return import_hyperscript2.default("span", {}, val.toString());
    }));
  });
  var mybleebers = component("my-bleebers", function(c) {
    return /* @__PURE__ */ import_hyperscript2.default("div", null, "bleebers: ", c.content, active(myfleeflers, {something: "wack"}));
  });
})();
//# sourceMappingURL=mycomponent.js.map
