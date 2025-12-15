const fs = require("fs");
const MySqliteRequest = require("./my_sqlite_request.js");

console.log("╔════════════════════════════════════════════════════════════╗");
console.log("║       MySQLite Complete Test Suite - 16 Tests             ║");
console.log("╚════════════════════════════════════════════════════════════╝\n");

// Load CSV data for browser-compatible version
const nbaContent = fs.readFileSync("nba_player_data.csv", "utf8");

// Create a second CSV file for JOIN testing
const teamData = `name,team_name,championships
LeBron James,Lakers,4
Stephen Curry,Warriors,4
Kevin Durant,Nets,2
Alaa Abdelnaby,Blazers,0`;

fs.writeFileSync("nba_teams.csv", teamData);

const csvData = {
  "nba_player_data.csv": nbaContent,
  "nba_teams.csv": teamData
};

let testsPassed = 0;
let testsFailed = 0;

function test(testNumber, taskName, fn) {
  try {
    console.log(`\n┌─────────────────────────────────────────────────────────┐`);
    console.log(`│ Test ${testNumber}/16: ${taskName.padEnd(48)} │`);
    console.log(`└─────────────────────────────────────────────────────────┘`);
    fn();
    console.log("   ✅ PASSED");
    testsPassed++;
  } catch (err) {
    console.log(`   ❌ FAILED: ${err.message}`);
    testsFailed++;
  }
}

// ==========================================
// SELECT Tests (3 tests)
// ==========================================
console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
console.log("  SECTION 1: SELECT Operations");
console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

test(1, "SELECT * - Return all columns", () => {
  const db = new MySqliteRequest(csvData);
  const result = db.from("nba_player_data.csv").run();
  if (result.length !== 4550) throw new Error(`Expected 4550 rows, got ${result.length}`);
  if (!result[0].name) throw new Error("Missing 'name' column");
  console.log(`   📊 Found ${result.length} players with all columns`);
  console.log(`   📝 First player: ${result[0].name}`);
});

test(2, "SELECT specific columns", () => {
  const db = new MySqliteRequest(csvData);
  const result = db.from("nba_player_data.csv").select(["name", "year_start"]).run();
  if (result.length !== 4550) throw new Error(`Expected 4550 rows, got ${result.length}`);
  if (Object.keys(result[0]).length !== 2) throw new Error("Should only have 2 columns");
  if (!result[0].name || !result[0].year_start) throw new Error("Missing expected columns");
  console.log(`   📊 Retrieved ${result.length} rows with 2 columns`);
  console.log(`   📝 Sample: ${result[0].name} (${result[0].year_start})`);
});

test(3, "SELECT single column", () => {
  const db = new MySqliteRequest(csvData);
  const result = db.from("nba_player_data.csv").select("name").run();
  if (Object.keys(result[0]).length !== 1) throw new Error("Should only have 1 column");
  console.log(`   📊 Retrieved ${result.length} names (single column)`);
  console.log(`   📝 First 3: ${result.slice(0, 3).map(r => r.name).join(", ")}`);
});

// ==========================================
// WHERE Tests (3 tests)
// ==========================================
console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
console.log("  SECTION 2: WHERE Filtering");
console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

test(4, "WHERE - Filter by name", () => {
  const db = new MySqliteRequest(csvData);
  const result = db.from("nba_player_data.csv").where("name", "LeBron James").run();
  if (result.length !== 1) throw new Error(`Expected 1 row, got ${result.length}`);
  if (result[0].name !== "LeBron James") throw new Error("Wrong player returned");
  console.log(`   🔍 Found: ${result[0].name}`);
  console.log(`   📝 Position: ${result[0].position}, Started: ${result[0].year_start}`);
});

test(5, "WHERE - Filter by year", () => {
  const db = new MySqliteRequest(csvData);
  const result = db.from("nba_player_data.csv").where("year_start", "2004").run();
  if (result.length === 0) throw new Error("Expected at least 1 row");
  console.log(`   🔍 Found ${result.length} players who started in 2004`);
  console.log(`   📝 Examples: ${result.slice(0, 3).map(r => r.name).join(", ")}`);
});

test(6, "WHERE + SELECT - Combined operations", () => {
  const db = new MySqliteRequest(csvData);
  const result = db
    .from("nba_player_data.csv")
    .select(["name", "position"])
    .where("name", "LeBron James")
    .run();
  if (result.length !== 1) throw new Error("Expected 1 row");
  if (Object.keys(result[0]).length !== 2) throw new Error("Should have 2 columns");
  console.log(`   🔍 Filtered and selected: ${result[0].name} - ${result[0].position}`);
});

// ==========================================
// JOIN Tests (2 tests)
// ==========================================
console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
console.log("  SECTION 3: JOIN Operations");
console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

test(7, "JOIN - Join two tables", () => {
  const db = new MySqliteRequest(csvData);
  const result = db
    .from("nba_player_data.csv")
    .join("name", "nba_teams.csv", "name")
    .select(["name", "position", "team_name", "championships"])
    .run();
  if (result.length === 0) throw new Error("Expected joined results");
  if (!result[0].team_name) throw new Error("Missing team_name from joined table");
  console.log(`   🔗 Joined ${result.length} records`);
  console.log(`   📝 ${result[0].name} - ${result[0].team_name} (${result[0].championships} championships)`);
});

test(8, "JOIN + WHERE - Join and filter", () => {
  const db = new MySqliteRequest(csvData);
  const result = db
    .from("nba_player_data.csv")
    .join("name", "nba_teams.csv", "name")
    .where("team_name", "Lakers")
    .run();
  if (result.length === 0) throw new Error("Expected at least 1 Lakers player");
  console.log(`   🔗 Found ${result.length} Lakers player(s)`);
  console.log(`   📝 ${result[0].name} - ${result[0].team_name}`);
});

// ==========================================
// ORDER BY Tests (3 tests)
// ==========================================
console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
console.log("  SECTION 4: ORDER BY Sorting");
console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

test(9, "ORDER BY ASC - Ascending order", () => {
  const db = new MySqliteRequest(csvData);
  const result = db
    .from("nba_player_data.csv")
    .select(["name", "year_start"])
    .order("asc", "year_start")
    .run();
  const first = result[0];
  const second = result[1];
  if (first.year_start > second.year_start) throw new Error("Not sorted in ascending order");
  console.log(`   ⬆️  Sorted ${result.length} players in ascending order`);
  console.log(`   📝 Oldest: ${first.name} (${first.year_start})`);
});

test(10, "ORDER BY DESC - Descending order", () => {
  const db = new MySqliteRequest(csvData);
  const result = db
    .from("nba_player_data.csv")
    .select(["name", "year_start"])
    .order("desc", "year_start")
    .run();
  const first = result[0];
  const second = result[1];
  if (first.year_start < second.year_start) throw new Error("Not sorted in descending order");
  console.log(`   ⬇️  Sorted ${result.length} players in descending order`);
  console.log(`   📝 Newest: ${first.name} (${first.year_start})`);
});

test(11, "ORDER BY + WHERE - Sort filtered results", () => {
  const db = new MySqliteRequest(csvData);
  const result = db
    .from("nba_player_data.csv")
    .select(["name", "year_start"])
    .where("year_start", "2010")
    .order("asc", "name")
    .run();
  console.log(`   🔍 Found ${result.length} players from 2010, sorted by name`);
  console.log(`   📝 First: ${result[0].name}, Last: ${result[result.length - 1].name}`);
});

// ==========================================
// INSERT Tests (1 test)
// ==========================================
console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
console.log("  SECTION 5: INSERT Operations");
console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

test(12, "INSERT - Add new row", () => {
  const testData = `name,year_start,position
Test Player,2020,G`;
  
  const testCsvData = { "test_insert.csv": testData };
  
  const db = new MySqliteRequest(testCsvData);
  db.insert("test_insert.csv").values({
    name: "New Player",
    year_start: "2021",
    position: "F"
  }).run();
  
  const db2 = new MySqliteRequest(testCsvData);
  const result = db2.from("test_insert.csv").run();
  
  if (result.length !== 2) throw new Error(`Expected 2 rows, got ${result.length}`);
  if (result[1].name !== "New Player") throw new Error("New player not found");
  console.log(`   ➕ Inserted: ${result[1].name} (${result[1].year_start})`);
  console.log(`   📊 Total rows: ${result.length}`);
});

// ==========================================
// UPDATE Tests (1 test)
// ==========================================
console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
console.log("  SECTION 6: UPDATE Operations");
console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

test(13, "UPDATE - Modify existing row", () => {
  const testData = `name,year_start,position
Test Player,2020,G
Another Player,2019,F`;
  
  const testCsvData = { "test_update.csv": testData };
  
  const db = new MySqliteRequest(testCsvData);
  db.update("test_update.csv")
    .set({ position: "C", year_start: "2021" })
    .where("name", "Test Player")
    .run();
  
  const db2 = new MySqliteRequest(testCsvData);
  const result = db2.from("test_update.csv").where("name", "Test Player").run();
  
  if (result[0].position !== "C") throw new Error("Position not updated");
  if (result[0].year_start !== "2021") throw new Error("Year not updated");
  console.log(`   ✏️  Updated: ${result[0].name}`);
  console.log(`   📝 New values - Position: ${result[0].position}, Year: ${result[0].year_start}`);
});

// ==========================================
// DELETE Tests (1 test)
// ==========================================
console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
console.log("  SECTION 7: DELETE Operations");
console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

test(14, "DELETE - Remove row", () => {
  const testData = `name,year_start,position
Keep Player,2020,G
Delete Player,2019,F
Another Keep,2018,C`;
  
  const testCsvData = { "test_delete.csv": testData };
  
  const db = new MySqliteRequest(testCsvData);
  db.from("test_delete.csv")
    .where("name", "Delete Player")
    .delete()
    .run();
  
  const db2 = new MySqliteRequest(testCsvData);
  const result = db2.from("test_delete.csv").run();
  
  if (result.length !== 2) throw new Error(`Expected 2 rows, got ${result.length}`);
  const names = result.map(r => r.name);
  if (names.includes("Delete Player")) throw new Error("Player was not deleted");
  console.log(`   🗑️  Deleted: "Delete Player"`);
  console.log(`   📊 Remaining rows: ${result.length}`);
});

// ==========================================
// Method Chaining Tests (2 tests)
// ==========================================
console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
console.log("  SECTION 8: Complex Method Chaining");
console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

test(15, "Chain: SELECT + WHERE + ORDER", () => {
  const db = new MySqliteRequest(csvData);
  const result = db
    .from("nba_player_data.csv")
    .select(["name", "year_start", "position"])
    .where("position", "G")
    .order("desc", "year_start")
    .run();
  if (result.length === 0) throw new Error("Expected results");
  console.log(`   🔗 Chained 3 operations successfully`);
  console.log(`   📊 Found ${result.length} guards, sorted by year`);
  console.log(`   📝 Latest guard: ${result[0].name} (${result[0].year_start})`);
});

test(16, "Chain: JOIN + WHERE + SELECT + ORDER", () => {
  const db = new MySqliteRequest(csvData);
  const result = db
    .from("nba_player_data.csv")
    .join("name", "nba_teams.csv", "name")
    .select(["name", "team_name", "championships"])
    .where("championships", "4")
    .order("asc", "name")
    .run();
  console.log(`   🔗 Chained 4 operations successfully`);
  console.log(`   📊 Found ${result.length} players with 4 championships`);
  result.forEach(r => console.log(`   📝 ${r.name} (${r.team_name})`));
});

// ==========================================
// Summary
// ==========================================
console.log("\n╔════════════════════════════════════════════════════════════╗");
console.log("║                    TEST SUMMARY                            ║");
console.log("╚════════════════════════════════════════════════════════════╝");
console.log(`\n   ✅ Passed: ${testsPassed}/16`);
console.log(`   ❌ Failed: ${testsFailed}/16`);
console.log(`   🎯 Success Rate: ${((testsPassed / 16) * 100).toFixed(1)}%\n`);

if (testsFailed === 0) {
  console.log("╔════════════════════════════════════════════════════════════╗");
  console.log("║  🎉 ALL TESTS PASSED! Implementation is complete! 🎉      ║");
  console.log("╚════════════════════════════════════════════════════════════╝\n");
} else {
  console.log(`   ⚠️  ${testsFailed} test(s) failed. Please review the errors above.\n`);
}

// Cleanup
fs.unlinkSync("nba_teams.csv");

console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
