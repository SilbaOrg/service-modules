// json-stable-stringify for Deno/TypeScript, adapted from the npm package
// Exports a single function: jsonStableStringify(obj: unknown): string

// Define JSON type hierarchy
type JSONPrimitive = string | number | boolean | null;
type JSONArray = JSONValue[];
type JSONObject = { [key: string]: JSONValue };
type JSONValue = JSONPrimitive | JSONArray | JSONObject;

export function jsonStableStringify(
  obj: unknown,
  opts?: {
    cmp?: (
      a: { key: string; value: unknown },
      b: { key: string; value: unknown }
    ) => number;
    space?: string | number;
    cycles?: boolean;
    replacer?: (key: string, value: unknown) => unknown;
  }
): string {
  opts = opts || {};
  if (typeof opts === "function") opts = { cmp: opts };
  let space: string = "";
  if (typeof opts.space === "number") {
    space = Array(opts.space + 1).join(" ");
  } else if (typeof opts.space === "string") {
    space = opts.space;
  }
  const cycles = typeof opts.cycles === "boolean" ? opts.cycles : false;
  const replacer =
    opts.replacer ||
    function (_key: string, value: unknown) {
      return value;
    };

  const cmp =
    opts.cmp &&
    ((
      f: (
        a: { key: string; value: unknown },
        b: { key: string; value: unknown }
      ) => number
    ) => {
      return function (node: JSONObject) {
        return function (a: string, b: string) {
          const aobj = { key: a, value: node[a] };
          const bobj = { key: b, value: node[b] };
          return f(aobj, bobj);
        };
      };
    })(opts.cmp);

  const seen: unknown[] = [];
  function stringify(
    parent: Record<string, unknown>,
    key: string,
    node: unknown,
    level: number
  ): string | undefined {
    const indent = space ? "\n" + new Array(level + 1).join(space) : "";
    const colonSeparator = space ? ": " : ":";

    if (
      node &&
      typeof (node as { toJSON?: () => unknown }).toJSON === "function"
    ) {
      node = (node as { toJSON: () => unknown }).toJSON();
    }

    node = replacer.call(parent, key, node);

    if (node === undefined) {
      return;
    }
    if (typeof node !== "object" || node === null) {
      return JSON.stringify(node);
    }
    if (Array.isArray(node)) {
      const out: string[] = [];
      for (let i = 0; i < node.length; i++) {
        // Create an array-like object that can be used with stringify
        const arrayAsParent = { [i]: node[i] } as Record<string, unknown>;
        const item =
          stringify(arrayAsParent, String(i), node[i], level + 1) ||
          JSON.stringify(null);
        out.push(indent + space + item);
      }
      return "[" + out.join(",") + indent + "]";
    } else {
      if (seen.indexOf(node) !== -1) {
        if (cycles) return JSON.stringify("__cycle__");
        throw new TypeError("Converting circular structure to JSON");
      } else seen.push(node);

      const nodeObj = node as Record<string, unknown>;
      const keys = Object.keys(nodeObj).sort(cmp && cmp(nodeObj as JSONObject));
      const out: string[] = [];
      for (let i = 0; i < keys.length; i++) {
        const k = keys[i];
        const value = stringify(nodeObj, k, nodeObj[k], level + 1);
        if (!value) continue;
        const keyValue = JSON.stringify(k) + colonSeparator + value;
        out.push(indent + space + keyValue);
      }
      seen.splice(seen.indexOf(node), 1);
      return "{" + out.join(",") + indent + "}";
    }
  }

  return stringify({ "": obj }, "", obj, 0) as string;
}
