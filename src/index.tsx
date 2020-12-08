import { sql } from "@pgtyped/query";
import { Client } from "pg";
import { ISelectNamesQuery } from "./index.types";
import * as routing from "fp-ts-routing";
import * as assert from "assert";
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
interface Home {
  _tag: "Home";
}
const defaults = routing.end;
const homeMatch = routing.lit("home").then(routing.end);

interface Resident {
  _tag: "Resident";
  residentId: number;
}
const residentMatch = routing
  .lit("resident")
  .then(routing.int("residentId"))
  .then(routing.end);

type Route = Home | Resident;
const pageRouter = routing
  .zero<Route>()
  .alt(defaults.parser.map(() => ({ _tag: "Home" })))
  .alt(homeMatch.parser.map(() => ({ _tag: "Home" })))
  .alt(residentMatch.parser.map((args) => ({ _tag: "Resident", ...args })));

// const apiRouter =
//   TODO: should probably make another type with a phantom type of the return type

function routingTests() {
  const parseRoute = (s: string): Route | null =>
    routing.parse(pageRouter, routing.Route.parse(s), null);

  assert.deepStrictEqual(parseRoute("/resident/5"), {
    _tag: "Resident",
    residentId: 5,
  });
  assert.deepStrictEqual(parseRoute("/resident/bleb"), null);
  assert.deepStrictEqual(
    routing.format(residentMatch.formatter, { residentId: 6 }),
    "/resident/6"
  );
}

routingTests();

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
            {active(mybleebers, { content: () => "bleb" })}
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
