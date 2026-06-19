import fs from "fs";
import path from "path";
import { pool } from "./pool";

async function init() {
  const sql = fs.readFileSync(path.join(__dirname, "init.sql"), "utf-8");
  await pool.query(sql);
  console.log("Schema initialized.");
  await pool.end();
}

const command = process.argv[2];

if (command === "init") {
  init().catch((err) => {
    console.error("Init failed:", err);
    process.exit(1);
  });
} else if (command === "seed") {
  import("./seed");
} else {
  console.error("Usage: tsx src/db/run.ts <init|seed>");
  process.exit(1);
}
