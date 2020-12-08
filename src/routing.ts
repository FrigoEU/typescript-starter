// TODO: maybe keeping these errors is a waste on production?
// TODO: support new types more freely? for newtypes mostly

interface TypeMapping {
  string: string;
  "string?": string | null;
  // "date": Date;
  // "date | null": Date | null;
  number: number;
  "number?": number | null;
  boolean: boolean;
  "boolean?": boolean | null;
}

type TypeMappingSafer<T extends string> = T extends keyof TypeMapping
  ? TypeMapping[T]
  : unknown;

type ExtractRouteParams<
  T extends string
> = T extends `${infer _Start}{${infer Param}:${infer Typ}}/${infer Rest}`
  ? {
      [k in Param]: TypeMappingSafer<Typ>;
    } &
      ExtractRouteParams<Rest>
  : T extends `${infer _Start}{${infer Param}:${infer Typ}}`
  ? { [k in Param]: TypeMappingSafer<Typ> }
  : {};

export interface Route<Params> {
  parse: (s: string) => Params | Error;
  link: (p: Params) => string;
}

const regex = /{[^}]+}|[^{}]*/g;
type Encoder<T> = {
  parse: (s: string) => Error | T;
  serialize: (t: T) => string;
};
type Part<T> =
  | { tag: "constant"; constant: string }
  | { tag: "capture"; key: string; encoder: Encoder<T> };
const encoders: { [k in keyof TypeMapping]: Encoder<TypeMapping[k]> } = {
  number: {
    parse: parseNumber,
    serialize: (n) => n.toString(),
  },
  "number?": {
    parse: parseNullable(parseNumber),
    serialize: serializeNullable((n) => n.toString()),
  },
  string: {
    parse: id,
    serialize: id,
  },
  "string?": {
    parse: parseNullable(id),
    serialize: serializeNullable(id),
  },
  boolean: {
    parse: parseBoolean,
    serialize: serializeBoolean,
  },
  "boolean?": {
    parse: parseNullable(parseBoolean),
    serialize: serializeNullable(serializeBoolean),
  },
};
// const nullableStringEncoder:
function parseNumber(str: string): Error | number {
  const res = Number.parseFloat(str);
  if (isNaN(res)) {
    return new Error("Failed to parse into number: " + str);
  } else {
    return res;
  }
}
function parseBoolean(s: string): boolean | Error {
  return s === "true"
    ? true
    : s === "false"
    ? false
    : new Error("Failed to parse into boolean: " + s);
}
function serializeBoolean(b: boolean): string {
  return b ? "true" : "false";
}
function parseNullable<T>(
  f: (str: string) => T
): (str: string) => Error | T | null {
  return function (str) {
    if (str === "null") {
      return null;
    } else {
      return f(str);
    }
  };
}
function serializeNullable<T>(f: (t: T) => string): (t: T | null) => string {
  return function (t: T | null) {
    if (t === null) {
      return "null";
    } else {
      return f(t);
    }
  };
}
function id<T>(a: T): T {
  return a;
}
function checkAllCasesHandled(param: never) {}
export function makeRoute<T extends string>(
  r: T
): Route<ExtractRouteParams<T>> {
  const parts = r.match(regex);
  if (parts === null) {
    throw new Error("Invalid path: " + r);
  } else {
    const cleanedParts = parts
      .filter(function (part) {
        return part.trim() !== "";
      })
      .map(function (part): Part<any> {
        if (part[0] === "{") {
          const split = part.substr(1, part.length - 2).split(":");
          if (split && split[0] && split[1]) {
            const encoder = encoders[split[1] as keyof TypeMapping];
            if (encoder === null) {
              throw new Error("No encoder found for type: " + split[1]);
            }
            return {
              tag: "capture",
              key: split[0],
              encoder: encoder,
            };
          } else {
            throw new Error("Invalid capture syntax: " + part);
          }
        } else {
          return {
            tag: "constant",
            constant: part,
          };
        }
      });
    return {
      parse: function (str: string) {
        const acc: { [key: string]: any } = {};
        let rest = str;
        for (let p of cleanedParts) {
          if (p.tag === "constant") {
            if (rest.substr(0, p.constant.length) === p.constant) {
              rest = rest.substr(p.constant.length);
            } else {
              return new Error(
                `Tried to match constant "${p.constant}" but failed. Remaining url: ${rest}`
              );
            }
          } else if (p.tag === "capture") {
            const captured = rest.split("/")[0];
            const parsed = p.encoder.parse(decodeURIComponent(captured));
            if (parsed.constructor === Error) {
              return new Error(parsed.message + ". Remaining url: " + rest);
            } else {
              acc[p.key] = parsed;
              rest = rest.substr(captured.length);
            }
          } else {
            checkAllCasesHandled(p);
          }
        }
        return acc as any;
      },
      link: function (params) {
        const acc: string = "";
        for (let p of cleanedParts) {
          if (p.tag === "constant") {
            acc.concat(p.constant);
          } else if (p.tag === "capture") {
            acc.concat(
              encodeURIComponent(p.encoder.serialize((params as any)[p.key]))
            );
          } else {
            checkAllCasesHandled(p);
          }
        }
        return acc;
      },
    };
  }
}

export interface AppRoute<Params, _BodyType, _ReturnType>
  extends Route<Params> {
  verb: "GET" | "POST";
}
export function defineRoute<S extends string>(s: S) {
  // : { returns: <T>() => AppRoute<ExtractRouteParams<S>, T> }
  return {
    isGet: function () {
      return {
        returns: function <T>(): AppRoute<ExtractRouteParams<S>, void, T> {
          return { verb: "GET", ...makeRoute(s) };
        },
      };
    },
    isPost: function <Body>() {
      return {
        returns: function <T>(): AppRoute<ExtractRouteParams<S>, Body, T> {
          return { verb: "POST", ...makeRoute(s) };
        },
      };
    },
  };
}
