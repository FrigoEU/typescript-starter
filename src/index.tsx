import { sql } from "@pgtyped/query";
import * as fs from "fs";
import * as http from "http";
import * as path from "path";
import h from "hyperscript";
import * as pg from "pg";
import {
  counterbutton,
  countershower,
  countershower2,
  mybleebers,
  myfleeflers,
} from "./client/mycomponent";
import { ISelectNamesQuery } from "./index.types";
import { active, initServersideSources, Source, dyn } from "./lib/reactive";
import * as routing from "./lib/routing";

// ROUTING

// First: "lib" code:
// TODO convert to async functions (?)
let allRoutes: {
  route: routing.AppRoute<any, any, any>;
  run: (req: http.IncomingMessage, res: http.ServerResponse, p: any) => void;
}[] = [];
function implementPageRoute<Params>(
  route: routing.AppRoute<Params, void, HTMLElement>,
  script: string,
  run: (p: Params, makeSource: <T>(a: T) => Source<T>) => HTMLElement
): void {
  allRoutes.push({
    route,
    run: function (_, res: http.ServerResponse, p: Params) {
      const { Source, mkSource } = initServersideSources();
      const r = run(p, mkSource);
      res.writeHead(200, { "Content-Type": "text/html" });
      const htm = (
        <html>
          <meta charset="UTF-8" />
          <head>
            {Source.genServersideHeader()}

            {/* TODO! Can we derive this somehow? */}
            <script src={script}></script>
          </head>
          <body>{r}</body>
        </html>
      );
      res.write(htm.outerHTML);
      res.end();
    },
  });
}
function implementApiRoute<Params, Body, Return>(
  route: routing.AppRoute<Params, Body, Return>,
  run: (p: Params, b: Body) => Return
): void {
  allRoutes.push({
    route,
    run: function (
      req: http.IncomingMessage,
      res: http.ServerResponse,
      p: Params
    ) {
      let data = "";
      req.on("data", (chunk) => {
        data += chunk;
      });
      req.on("end", () => {
        const r = run(p, JSON.parse(data));
        res.writeHead(200, { "Content-Type": "application/json" });
        res.write(JSON.stringify(r));
        res.end();
      });
    },
  });
}

const mime = {
  ".html": "text/html",
  ".css": "text/css",
  ".js": "text/javascript",
};
type mimes = keyof typeof mime;

function makeServer(routes: typeof allRoutes) {
  return http.createServer(function (req, res) {
    allRoutes.forEach(function (route) {
      const parsed = route.route.parse(req.url || "");
      if (parsed.constructor === Error) {
        console.log(parsed.message);
      } else {
        route.run(req, res, parsed);
      }
    });

    const u = path.resolve(path.join("./" + req.url) || "./index.html");
    console.log("Trying to find file: " + u);
    if (fs.existsSync(u)) {
      const stream = fs.createReadStream(u);
      stream.on("ready", () => {
        const type =
          mime[path.parse(u).ext as mimes] || "application/octet-stream";
        console.log(`${req.method} ${req.url} => 200 ${type}`);
        res.writeHead(200, { "content-type": type });
        stream.pipe(res);
      });
      stream.on("error", (err) => {
        console.log(`${req.method} ${req.url} => 500 ${u} ${err.name}`);
        res.writeHead(500, err.name);
        res.end(JSON.stringify(err));
      });
      return;
    }

    res.writeHead(404);
    res.end();
  });
}

//Actual implementation of routes
const homeRoute = routing.defineRoute("/home").isGet().returns<HTMLElement>();
const residentRoute = routing
  .defineRoute("/site/{siteName:string}/resident/{residentId:number}")
  .isGet()
  .returns<HTMLElement>();
const myApiRoute = routing
  .defineRoute("/myapi/{someId:number}")
  .isPost<string>()
  .returns<number>();

implementPageRoute(homeRoute, "", () => <div>You're home!</div>);
implementPageRoute(
  residentRoute,
  "/out/browser/mycomponent.js", // TODO: not very nice, see other comments about client code bundling / loading
  (r, mkSource) => {
    const counter = mkSource(0);
    return (
      <div>
        You're at resident number {r.residentId.toExponential()} in site
        {r.siteName}. <br />
        {active(counterbutton, { counter })}
        {active(countershower, { counter })}
      </div>
    );
  }
);
implementApiRoute(myApiRoute, (r) => r.someId);

makeServer(allRoutes).listen(8081);

// DATABASE
const dbConfig = {
  host: "localhost",
  database: "tstest",
};

interface Flavoring<FlavorT> {
  _type?: FlavorT;
}
export type Flavor<T, FlavorT> = T & Flavoring<FlavorT>;
type UserId = Flavor<number, "UserId">;
type ResidentId = Flavor<number, "ResidentId">;

export const selectNames = sql<ISelectNamesQuery>`
select foo.id, bar.id as bar__id, bar.value
from foo
left outer join bar on bar.foo_id = foo.id
`;

async function dbStuff() {
  const client = new pg.Client(dbConfig);

  await client.connect();
  const students = await selectNames.run(({} as unknown) as void, client);
  function printResidentId(id: ResidentId) {
    console.log(id);
  }
  students.forEach(function (stu: {
    id: UserId;
    bar__id: number | null;
    value: number | null;
  }) {
    console.log(stu.id);
    // @ts-expect-error
    printResidentId(stu.id);
    if (stu.value === null) {
      console.log("is null");
    }
  });
}

/* dbStuff(); */

// UI stuff

function sendStatic(url: string, res: http.ServerResponse) {
  fs.readFile(__dirname + url, function (err, data) {
    if (err) {
      res.writeHead(404);
      res.end(JSON.stringify(err));
      return;
    }
    res.writeHead(200);
    res.end(data);
  });
}

const server2 = http
  .createServer(function (req, res) {
    const { Source } = initServersideSources();
    if (req.url === "/client/mycomponent.bundle.js") {
      return sendStatic(req.url, res);
    }
    res.writeHead(200, { "Content-Type": "text/html" });
    const counter = new Source(0);
    const htmlstuff = (
      <html>
        <meta charset="UTF-8" />
        <head>
          {/* Order of these scripts is very important! */}
          {Source.genServersideHeader()}
          <script src="./client/mycomponent.bundle.js"></script>
        </head>
        <body>
          <div>
            <div>bl</div>
          </div>
          <div class="bleb">
            Hallokes
            {active(mybleebers, { content: "bleb" })}
            {active(myfleeflers, { something: "flee" })}
            {active(counterbutton, { counter })}
            {active(countershower, { counter })}
            {active(countershower2, { counter })}
            {[1, 2, ["blke", "ebl", active(countershower2, { counter })]]}
          </div>
        </body>
      </html>
    );
    res.write(htmlstuff.outerHTML);
    res.end();
  })
  .listen(8080);
