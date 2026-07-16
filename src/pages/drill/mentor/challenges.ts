/**
 * Seed challenges for the Code Mentor. Every description is ORIGINAL wording —
 * the links go out to refactoring.guru / MDN for the full theory, we never
 * copy their text. Examples are RELATED snippets (same technique, different
 * scenario) so typing your own solution stays the exercise.
 */

export type Snippet = { title: string; note: string; code: string };

export type Challenge = {
  id: string;
  /** big label on the card, e.g. "STRATEGY" */
  title: string;
  /** what you build with it, e.g. "km-billing rules" */
  subtitle: string;
  /** one short line: what "done" means */
  goal: string;
  /** mini-flow diagram boxes, top to bottom */
  flow: string[];
  link: string;
  linkLabel: string;
  examples: Snippet[];
};

export const CHALLENGES: Challenge[] = [
  {
    id: "bff",
    title: "BFF FAN-OUT",
    subtitle: "one endpoint, three services",
    goal: "One call in → three downstream calls in parallel → one merged answer out.",
    flow: ["REQUEST", "3 CALLS · PARALLEL", "MERGE", "ONE RESPONSE"],
    link: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/all",
    linkLabel: "MDN · Promise.all",
    examples: [
      {
        title: "Parallel fetch — weather app",
        note: "Same shape, different domain: three sources, one screen.",
        code: `async function loadWeatherScreen(city: string) {
  const [now, week, alerts] = await Promise.all([
    fetchCurrent(city),
    fetchForecast(city),
    fetchAlerts(city),
  ]);
  return { now, week, alerts };
}`,
      },
      {
        title: "Don't let one failure kill all",
        note: "allSettled keeps the good parts when one source is down.",
        code: `const results = await Promise.allSettled([a(), b(), c()]);
const ok = results
  .filter((r) => r.status === "fulfilled")
  .map((r) => (r as PromiseFulfilledResult<Data>).value);`,
      },
    ],
  },
  {
    id: "strategy",
    title: "STRATEGY",
    subtitle: "km-billing rules",
    goal: "Swap the billing rule (per-km, flat, tiered) without touching the caller.",
    flow: ["TRIP", "PICK RULE", "RULE.calc()", "PRICE"],
    link: "https://refactoring.guru/design-patterns/strategy",
    linkLabel: "refactoring.guru · Strategy",
    examples: [
      {
        title: "Strategy — shipping cost",
        note: "One interface, many rules. The cart never knows which.",
        code: `interface ShippingRule {
  cost(weightKg: number): number;
}
const road: ShippingRule = { cost: (w) => 40 + w * 6 };
const air: ShippingRule = { cost: (w) => 120 + w * 18 };

function quote(rule: ShippingRule, w: number) {
  return rule.cost(w); // caller stays identical
}`,
      },
      {
        title: "Picking the strategy",
        note: "A lookup table beats an if-ladder.",
        code: `const rules: Record<string, ShippingRule> = { road, air };
const rule = rules[order.method] ?? road;`,
      },
    ],
  },
  {
    id: "observer",
    title: "OBSERVER",
    subtitle: "notification gating",
    goal: "Something happens once → every subscribed listener hears it, none are hard-wired.",
    flow: ["EVENT", "SUBJECT", "notify()", "EACH LISTENER"],
    link: "https://refactoring.guru/design-patterns/observer",
    linkLabel: "refactoring.guru · Observer",
    examples: [
      {
        title: "Observer — stock ticker",
        note: "Subscribers come and go; the ticker never changes.",
        code: `type Listener = (price: number) => void;

class Ticker {
  private subs = new Set<Listener>();
  subscribe(fn: Listener) {
    this.subs.add(fn);
    return () => this.subs.delete(fn); // unsubscribe
  }
  push(price: number) {
    this.subs.forEach((fn) => fn(price));
  }
}`,
      },
      {
        title: "Gate inside the listener",
        note: "The subject broadcasts everything; each listener decides.",
        code: `ticker.subscribe((p) => {
  if (p > user.alertAbove) sendPush(user, p);
});`,
      },
    ],
  },
  {
    id: "builder",
    title: "BUILDER",
    subtitle: "vehicle response DTO",
    goal: "Assemble a big response object step by step — no 9-argument constructor.",
    flow: ["EMPTY", ".withPlate()", ".withOdo()", ".build()"],
    link: "https://refactoring.guru/design-patterns/builder",
    linkLabel: "refactoring.guru · Builder",
    examples: [
      {
        title: "Builder — HTTP request",
        note: "Each step returns `this`; build() seals it.",
        code: `class RequestBuilder {
  private headers: Record<string, string> = {};
  private body?: string;
  header(k: string, v: string) { this.headers[k] = v; return this; }
  json(data: unknown) { this.body = JSON.stringify(data); return this; }
  build(url: string): Request {
    return new Request(url, { headers: this.headers, body: this.body });
  }
}`,
      },
      {
        title: "Why not one constructor?",
        note: "Optional fields explode combinations; steps stay readable.",
        code: `const req = new RequestBuilder()
  .header("accept", "application/json")
  .json({ q: "term" })
  .build("/search");`,
      },
    ],
  },
  {
    id: "factory",
    title: "FACTORY METHOD",
    subtitle: "report exporter",
    goal: "Callers ask for \"an exporter\" — the factory decides pdf / csv / xlsx.",
    flow: ["FORMAT?", "FACTORY", "NEW EXPORTER", ".export()"],
    link: "https://refactoring.guru/design-patterns/factory-method",
    linkLabel: "refactoring.guru · Factory Method",
    examples: [
      {
        title: "Factory — message parser",
        note: "Same idea, different family of products.",
        code: `interface Parser { parse(raw: string): Msg; }

function parserFor(mime: string): Parser {
  switch (mime) {
    case "application/json": return new JsonParser();
    case "text/xml": return new XmlParser();
    default: return new PlainParser();
  }
}
// caller: parserFor(req.type).parse(body)`,
      },
      {
        title: "One place to grow",
        note: "New format = one new class + one case. Callers untouched.",
        code: `case "text/yaml": return new YamlParser();`,
      },
    ],
  },
  {
    id: "decorator",
    title: "DECORATOR",
    subtitle: "logging wrapper",
    goal: "Add logging around any service by wrapping it — the service never knows.",
    flow: ["SERVICE", "WRAP", "LOG + CALL THROUGH", "SAME INTERFACE"],
    link: "https://refactoring.guru/design-patterns/decorator",
    linkLabel: "refactoring.guru · Decorator",
    examples: [
      {
        title: "Decorator — caching wrapper",
        note: "Wraps the same interface; adds one concern.",
        code: `interface Repo { find(id: string): Promise<Item>; }

class CachedRepo implements Repo {
  private cache = new Map<string, Item>();
  constructor(private inner: Repo) {}
  async find(id: string) {
    const hit = this.cache.get(id);
    if (hit) return hit;
    const item = await this.inner.find(id);
    this.cache.set(id, item);
    return item;
  }
}`,
      },
      {
        title: "Stack them",
        note: "Wrappers compose because the interface never changes.",
        code: `const repo = new CachedRepo(new TimedRepo(new DbRepo()));`,
      },
    ],
  },
];

/** A free-typed idea becomes a challenge with a generic warm-up flow. */
export function customChallenge(idea: string): Challenge {
  const clean = idea.trim();
  return {
    id: "custom",
    title: clean.length > 26 ? `${clean.slice(0, 25).toUpperCase()}…` : clean.toUpperCase(),
    subtitle: "your own idea",
    goal: clean,
    flow: ["IDEA", "SKETCH THE SHAPE", "TYPE IT", "ANALYSE"],
    link: "https://refactoring.guru/design-patterns/catalog",
    linkLabel: "refactoring.guru · catalog",
    examples: [],
  };
}
