import { sql } from "@pgtyped/query";
import { Client } from "pg";
import { ISelectNamesQuery } from "./index.types";
import * as routing from "fp-ts-routing";
import * as assert from "assert";

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
const router = routing
  .zero<Route>()
  .alt(defaults.parser.map(() => ({ _tag: "Home" })))
  .alt(homeMatch.parser.map(() => ({ _tag: "Home" })))
  .alt(residentMatch.parser.map((args) => ({ _tag: "Resident", ...args })));

function routingTests() {
  const parseRoute = (s: string): Route | null =>
    routing.parse(router, routing.Route.parse(s), null);

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
