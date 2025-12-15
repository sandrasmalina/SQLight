const readline = require("readline");
const fs = require("fs");
const MySqliteRequest = require("./my_sqlite_request.js");

console.log("MySQLite version 0.1 (js)");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  prompt: "my_sqlite_cli> "
});

rl.prompt();

rl.on("line", line => {
  const input = line.trim();

  if (input.toLowerCase() === "quit") {
    rl.close();
    return;
  }

  try {
    if (input.startsWith("SELECT")) {
      executeSelect(input);
    } else if (input.startsWith("INSERT")) {
      executeInsert(input);
    } else if (input.startsWith("UPDATE")) {
      executeUpdate(input);
    } else if (input.startsWith("DELETE")) {
      executeDelete(input);
    } else {
      console.log("Unknown command");
    }
  } catch (err) {
    console.log("Error:", err.message);
  }

  rl.prompt();
});

rl.on("close", () => process.exit(0));

// -------------------------------------
// SELECT
// -------------------------------------
function executeSelect(query) {
  const parts = query.split(/\s+/);

  const selectPart = parts[1];
  const table = parts[3];

  let fileContent;
  try {
    fileContent = fs.readFileSync(table, 'utf8');
  } catch (err) {
    console.log(`Error reading table ${table}:`, err.message);
    return;
  }

  let req = new MySqliteRequest({ [table]: fileContent }).from(table);

  if (selectPart !== "*") {
    req = req.select(selectPart.split(","));
  }

  if (query.includes("WHERE")) {
    const wherePart = query.split("WHERE")[1].trim();
    const [col, val] = wherePart.split("=");
    req = req.where(col.trim(), val.replace(/[';]/g, "").trim());
  }

  const result = req.run();
  result.forEach(row => {
    console.log(Object.values(row).join("|"));
  });
}

// -------------------------------------
// INSERT
// -------------------------------------
function executeInsert(query) {
  const table = query.split(/\s+/)[2];

  const valuesPart = query.match(/\((.*?)\)/)[1];
  const values = valuesPart.split(",").map(v => v.trim());

  let fileContent;
  try {
    fileContent = fs.readFileSync(table, "utf8");
  } catch (e) {
    // If file doesn't exist, we might want to create it, but for now assuming it exists like existing code does
    fileContent = "";
  }

  const headers = fileContent.split("\n")[0].split(",");
  const data = {};
  headers.forEach((h, i) => {
    data[h] = values[i];
  });

  const req = new MySqliteRequest({ [table]: fileContent });
  req.insert(table).values(data).run();

  fs.writeFileSync(table, req.csvData[table]);
}

// -------------------------------------
// UPDATE
// -------------------------------------
function executeUpdate(query) {
  const table = query.split(/\s+/)[1];

  const setSection = query.split("SET")[1].split("WHERE")[0];
  const updates = {};

  setSection.split(",").forEach(pair => {
    const [key, value] = pair.split("=");
    updates[key.trim()] = value.replace(/[';]/g, "").trim();
  });

  const wherePart = query.split("WHERE")[1].trim();
  const [col, val] = wherePart.split("=");

  let fileContent;
  try {
    fileContent = fs.readFileSync(table, 'utf8');
  } catch (err) {
    console.log(`Error reading table ${table}:`, err.message);
    return;
  }

  const req = new MySqliteRequest({ [table]: fileContent });
  req
    .update(table)
    .set(updates)
    .where(col.trim(), val.replace(/[';]/g, "").trim())
    .run();

  fs.writeFileSync(table, req.csvData[table]);
}

// -------------------------------------
// DELETE
// -------------------------------------
function executeDelete(query) {
  const table = query.split(/\s+/)[2];

  const wherePart = query.split("WHERE")[1].trim();
  const [col, val] = wherePart.split("=");

  let fileContent;
  try {
    fileContent = fs.readFileSync(table, 'utf8');
  } catch (err) {
    console.log(`Error reading table ${table}:`, err.message);
    return;
  }

  const req = new MySqliteRequest({ [table]: fileContent });
  req
    .from(table)
    .where(col.trim(), val.replace(/[';]/g, "").trim())
    .delete()
    .run();

  fs.writeFileSync(table, req.csvData[table]);
}
