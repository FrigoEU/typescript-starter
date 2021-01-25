import { sql } from "@pgtyped/query";
import { Client } from "pg";
import { ISelectNamesQuery } from "./index.types";
import * as routing from "./routing";
import * as fs from "fs";
import * as http from "http";
import h from "hyperscript";
import { active, initServersideSources } from "./client/reactive";
import {
  counterbutton,
  countershower,
  countershower2,
  mybleebers,
  myfleeflers,
} from "./client/mycomponent";

// ROUTING

// TODO convert to async functions (?)
let allRoutes: {
  route: routing.AppRoute<any, any, any>;
  run: (req: http.IncomingMessage, res: http.ServerResponse, p: any) => void;
}[] = [];
function implementPageRoute<Params>(
  route: routing.AppRoute<Params, void, HTMLElement>,
  run: (p: Params) => HTMLElement
): void {
  allRoutes.push({
    route,
    run: function (_, res: http.ServerResponse, p: Params) {
      const r = run(p);
      res.writeHead(200, { "Content-Type": "text/html" });
      res.write(r.outerHTML);
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

const homeRoute = routing.defineRoute("/home").isGet().returns<HTMLElement>();
const residentRoute = routing
  .defineRoute("/site/{siteName:string}/resident/{residentId:number}")
  .isGet()
  .returns<HTMLElement>();
const myApiRoute = routing
  .defineRoute("/myapi/{someId:number}")
  .isPost<string>()
  .returns<number>();

implementPageRoute(homeRoute, () => <div>You're home!</div>);
implementPageRoute(residentRoute, (r) => (
  <div>
    You're at resident number {r.residentId.toExponential()} in site
    {r.siteName}
  </div>
));
implementApiRoute(myApiRoute, (r) => r.someId);

const server = http
  .createServer(function (req, res) {
    for (let route of allRoutes) {
      const parsed = route.route.parse(req.url || "");
      if (parsed.constructor === Error) {
        console.log(parsed.message);
      } else {
        route.run(req, res, parsed);
      }
    }
    res.writeHead(404);
    res.end();
  })
  .listen(8081);

// DATABASE
const dbConfig = {
  host: "localhost",
  database: "urwebschool",
};

interface Flavoring<FlavorT> {
  _type?: FlavorT;
}
export type Flavor<T, FlavorT> = T & Flavoring<FlavorT>;
type UserId = Flavor<number, "UserId">;
type ResidentId = Flavor<number, "ResidentId">;

export const selectNames = sql<ISelectNamesQuery>`
select users.id, names.name
from users
join names on names.userid = users.id
`;

async function dbStuff() {
  const client = new Client(dbConfig);

  await client.connect();
  const students = await selectNames.run({}, client);
  function printResidentId(id: ResidentId) {
    console.log(id);
  }
  students.forEach(function (stu: { id: UserId; name: string }) {
    console.log(stu.id);
    // @ts-expect-error
    printResidentId(stu.id);
    if (stu.name === null) {
      console.log("is null");
    }
  });
}

dbStuff();

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
