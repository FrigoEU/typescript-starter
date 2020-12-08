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

let allRoutes: {
  route: routing.RouteWithReturnType<any, any>;
  run: (res: http.ServerResponse, p: any) => void;
}[] = [];
function implementPageRoute<Params>(
  route: routing.RouteWithReturnType<Params, HTMLElement>,
  run: (p: Params) => HTMLElement
): void {
  allRoutes.push({
    route,
    run: function (res: http.ServerResponse, p: Params) {
      const r = run(p);
      res.writeHead(200, { "Content-Type": "text/html" });
      res.write(r.outerHTML);
      res.end();
    },
  });
}
function implementApiRoute<Params, ReturnType>(
  route: routing.RouteWithReturnType<Params, ReturnType>,
  run: (p: Params) => ReturnType
): void {
  allRoutes.push({
    route,
    run: function (res: http.ServerResponse, p: Params) {
      const r = run(p);
      res.writeHead(200, { "Content-Type": "application/json" });
      res.write(JSON.stringify(r));
      res.end();
    },
  });
}

const homeRoute = routing.defineRoute("/home").returns<HTMLElement>();

const residentRoute = routing
  .defineRoute("/site/{siteName:string}/resident/{residentId:number}")
  .returns<HTMLElement>();

const myApiRoute = routing
  .defineRoute("/myapi/{someId:number}")
  .returns<number>();

implementPageRoute(homeRoute, () => <div>You're home!</div>);
implementPageRoute(residentRoute, (r) => (
  <div>
    You're at resident number {r.residentId.toExponential()} in site
    {r.siteName}
  </div>
));
implementApiRoute(myApiRoute, (r) => r.someId);

http
  .createServer(function (req, res) {
    for (let route of allRoutes) {
      const parsed = route.route.parse(req.url || "");
      if (parsed.constructor === Error) {
        console.log(parsed.message);
      } else {
        route.run(res, parsed);
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

export const selectNames = sql<ISelectNamesQuery>`
select users.id, names.name
from users
join names on names.userid = users.id
`;

async function dbStuff() {
  const client = new Client(dbConfig);

  await client.connect();
  const students = await selectNames.run(({} as unknown) as void, client);
  students.forEach(function (stu) {
    console.log(stu.id);
    if (stu.name === null) {
      console.log("is null");
    }
  });
}

dbStuff();

// Webserver stuff

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

http
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
          <div class="bleb">
            Hallokes
            {active(mybleebers, { content: "bleb" })}
            {active(counterbutton, { counter })}
            {active(countershower, { counter })}
            {active(countershower2, { counter })}
          </div>
        </body>
      </html>
    );
    res.write(htmlstuff.outerHTML); //write a response to the client
    res.end(); //end the response
  })
  .listen(8080); //the server object listens on port 8080
