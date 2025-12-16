const MySqliteRequest = require("./my_sqlite_request");
const fs = require("fs");

const csv = fs.readFileSync("nba_players.csv", "utf8");

const req = new MySqliteRequest({ "nba_players.csv": csv });

const result = req
    .from("nba_players.csv")
    .select("Player")
    .where("birth_state", "Indiana")
    .run();

console.log(result);
