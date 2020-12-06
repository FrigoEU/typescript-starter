import { sql } from "@pgtyped/query";
import { Client } from "pg";
import { ISelectStudentFirstnamesQuery } from "./index.types";

const dbConfig = {
  host: "localhost",
  database: "urwebschool",
};

export const client = new Client(dbConfig);

async function main() {
  console.log("bleb");
  await client.connect();
  const students = await selectStudentFirstnames.run(
    ({} as unknown) as void,
    client
  );
  students.forEach((stu) => {
    console.log(stu.firstname);
  });
}

main();

export const selectStudentFirstnames = sql<ISelectStudentFirstnamesQuery>`
  select uw_firstname as firstname
  from uw_student_students
`;
