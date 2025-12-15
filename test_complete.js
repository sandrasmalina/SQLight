const fs = require("fs");
const MySqliteRequest = require("./my_sqlite_request.js");

console.log("=== MySQLite Complete Feature Test Suite ===\n");

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

function test(name, fn) {
  try {
    console.log(`\n📝 ${name}`);
    fn();
    console.log("   ✅ PASSED");
    testsPassed++;
  } catch (err) {
    console.log(`   ❌ FAILED: ${err.message}`);
    testsFailed++;
  }
}

// ==========================================
// 1. SELECT - Basic functionality
// ==========================================
console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
console.log("1️⃣  SELECT Tests");
console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

test("SELECT * - Returns all rows and columns", () => {
  const db = new MySqliteRequest(csvData);
  const result = db.from("nba_player_data.csv").run();
  if (result.length !== 4550) throw new Error(`Expected 4550 rows, got ${result.length}`);
  if (!result[0].name) throw new Error("Missing 'name' column");
  console.log(`   Found ${result.length} players`);
});

test("SELECT specific columns", () => {
  const db = new MySqliteRequest(csvData);
  const result = db.from("nba_player_data.csv").select(["name", "year_start"]).run();
  if (result.length !== 4550) throw new Error(`Expected 4550 rows, got ${result.length}`);
  if (Object.keys(result[0]).length !== 2) throw new Error("Should only have 2 columns");
  if (!result[0].name || !result[0].year_start) throw new Error("Missing expected columns");
  console.log(`   First player: ${result[0].name} (${result[0].year_start})`);
});

test("SELECT single column", () => {
  const db = new MySqliteRequest(csvData);
  const result = db.from("nba_player_data.csv").select("name").run();
  if (Object.keys(result[0]).length !== 1) throw new Error("Should only have 1 column");
  console.log(`   Retrieved ${result.length} names`);
});

// ==========================================
// 2. WHERE - Filtering
// ==========================================
console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
console.log("2️⃣  WHERE Tests");
console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

test("WHERE - Filter by name", () => {
  const db = new MySqliteRequest(csvData);
  const result = db.from("nba_player_data.csv").where("name", "LeBron James").run();
  if (result.length !== 1) throw new Error(`Expected 1 row, got ${result.length}`);
  if (result[0].name !== "LeBron James") throw new Error("Wrong player returned");
  console.log(`   Found: ${result[0].name}, Position: ${result[0].position}`);
});

test("WHERE - Filter by year", () => {
  const db = new MySqliteRequest(csvData);
  const result = db.from("nba_player_data.csv").where("year_start", "2004").run();
  if (result.length === 0) throw new Error("Expected at least 1 row");
  console.log(`   Found ${result.length} players who started in 2004`);
});

test("WHERE with SELECT - Combined filtering and column selection", () => {
  const db = new MySqliteRequest(csvData);
  const result = db
    .from("nba_player_data.csv")
    .select(["name", "position"])
    .where("name", "LeBron James")
    .run();
  if (result.length !== 1) throw new Error("Expected 1 row");
  if (Object.keys(result[0]).length !== 2) throw new Error("Should have 2 columns");
  console.log(`   ${result[0].name} - ${result[0].position}`);
});

// ==========================================
// 3. JOIN - Table joining
// ==========================================
console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
console.log("3️⃣  JOIN Tests");
console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

test("JOIN - Join two tables", () => {
  const db = new MySqliteRequest(csvData);
  const result = db
    .from("nba_player_data.csv")
    .join("name", "nba_teams.csv", "name")
    .select(["name", "position", "team_name", "championships"])
    .run();
  if (result.length === 0) throw new Error("Expected joined results");
  if (!result[0].team_name) throw new Error("Missing team_name from joined table");
  console.log(`   Joined ${result.length} records`);
  console.log(`   Example: ${result[0].name} - ${result[0].team_name} (${result[0].championships} championships)`);
});

test("JOIN with WHERE - Join and filter", () => {
  const db = new MySqliteRequest(csvData);
  const result = db
    .from("nba_player_data.csv")
    .join("name", "nba_teams.csv", "name")
    .where("team_name", "Lakers")
    .run();
  if (result.length === 0) throw new Error("Expected at least 1 Lakers player");
  console.log(`   Found ${result.length} Lakers player(s)`);
});

// ==========================================
// 4. ORDER BY - Sorting
// ==========================================
console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
console.log("4️⃣  ORDER BY Tests");
console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

test("ORDER BY ASC - Ascending order", () => {
  const db = new MySqliteRequest(csvData);
  const result = db
    .from("nba_player_data.csv")
    .select(["name", "year_start"])
    .order("asc", "year_start")
    .run();
  const first = result[0];
  const second = result[1];
  if (first.year_start > second.year_start) throw new Error("Not sorted in ascending order");
  console.log(`   First: ${first.name} (${first.year_start})`);
  console.log(`   Second: ${second.name} (${second.year_start})`);
});

test("ORDER BY DESC - Descending order", () => {
  const db = new MySqliteRequest(csvData);
  const result = db
    .from("nba_player_data.csv")
    .select(["name", "year_start"])
    .order("desc", "year_start")
    .run();
  const first = result[0];
  const second = result[1];
  if (first.year_start < second.year_start) throw new Error("Not sorted in descending order");
  console.log(`   First: ${first.name} (${first.year_start})`);
  console.log(`   Last: ${result[result.length - 1].name} (${result[result.length - 1].year_start})`);
});

test("ORDER BY with WHERE - Sort filtered results", () => {
  const db = new MySqliteRequest(csvData);
  const result = db
    .from("nba_player_data.csv")
    .select(["name", "year_start"])
    .where("year_start", "2010")
    .order("asc", "name")
    .run();
  console.log(`   Found ${result.length} players from 2010, sorted by name`);
});

// ==========================================
// 5. INSERT - Adding new rows
// ==========================================
console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
console.log("5️⃣  INSERT Tests");
console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

test("INSERT - Add new row", () => {
  // Create a test CSV
  const testData = `name,year_start,position
Test Player,2020,G`;
  
  const testCsvData = { "test_insert.csv": testData };
  
  const db = new MySqliteRequest(testCsvData);
  db.insert("test_insert.csv").values({
    name: "New Player",
    year_start: "2021",
    position: "F"
  }).run();
  
  // Verify insertion using the SAME csvData object (it was updated in-place)
  const db2 = new MySqliteRequest(testCsvData);
  const result = db2.from("test_insert.csv").run();
  
  if (result.length !== 2) throw new Error(`Expected 2 rows, got ${result.length}`);
  if (result[1].name !== "New Player") throw new Error("New player not found");
  console.log(`   Inserted: ${result[1].name} (${result[1].year_start})`);
  console.log(`   Total rows: ${result.length}`);
});

// ==========================================
// 6. UPDATE - Modifying rows
// ==========================================
console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
console.log("6️⃣  UPDATE Tests");
console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

test("UPDATE - Modify existing row", () => {
  // Create a test CSV
  const testData = `name,year_start,position
Test Player,2020,G
Another Player,2019,F`;
  
  const testCsvData = { "test_update.csv": testData };
  
  const db = new MySqliteRequest(testCsvData);
  db.update("test_update.csv")
    .set({ position: "C", year_start: "2021" })
    .where("name", "Test Player")
    .run();
  
  // Verify update using the SAME csvData object (it was updated in-place)
  const db2 = new MySqliteRequest(testCsvData);
  const result = db2.from("test_update.csv").where("name", "Test Player").run();
  
  if (result[0].position !== "C") throw new Error("Position not updated");
  if (result[0].year_start !== "2021") throw new Error("Year not updated");
  console.log(`   Updated: ${result[0].name} - Position: ${result[0].position}, Year: ${result[0].year_start}`);
});

// ==========================================
// 7. DELETE - Removing rows
// ==========================================
console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
console.log("7️⃣  DELETE Tests");
console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

test("DELETE - Remove row", () => {
  // Create a test CSV
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
  
  // Verify deletion using the SAME csvData object (it was updated in-place)
  const db2 = new MySqliteRequest(testCsvData);
  const result = db2.from("test_delete.csv").run();
  
  if (result.length !== 2) throw new Error(`Expected 2 rows, got ${result.length}`);
  const names = result.map(r => r.name);
  if (names.includes("Delete Player")) throw new Error("Player was not deleted");
  console.log(`   Deleted 1 row, ${result.length} rows remaining`);
});

// ==========================================
// 8. Method Chaining
// ==========================================
console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
console.log("8️⃣  Method Chaining Tests");
console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

test("Complex chain: SELECT + WHERE + ORDER", () => {
  const db = new MySqliteRequest(csvData);
  const result = db
    .from("nba_player_data.csv")
    .select(["name", "year_start", "position"])
    .where("position", "G")
    .order("desc", "year_start")
    .run();
  if (result.length === 0) throw new Error("Expected results");
  console.log(`   Found ${result.length} guards, sorted by year`);
  console.log(`   Latest: ${result[0].name} (${result[0].year_start})`);
});

test("Complex chain: JOIN + WHERE + SELECT + ORDER", () => {
  const db = new MySqliteRequest(csvData);
  const result = db
    .from("nba_player_data.csv")
    .join("name", "nba_teams.csv", "name")
    .select(["name", "team_name", "championships"])
    .where("championships", "4")
    .order("asc", "name")
    .run();
  console.log(`   Found ${result.length} players with 4 championships`);
  result.forEach(r => console.log(`     - ${r.name} (${r.team_name})`));
});

// ==========================================
// Summary
// ==========================================
console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
console.log("📊 Test Summary");
console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
console.log(`✅ Passed: ${testsPassed}`);
console.log(`❌ Failed: ${testsFailed}`);
console.log(`📈 Total:  ${testsPassed + testsFailed}`);
console.log(`🎯 Success Rate: ${((testsPassed / (testsPassed + testsFailed)) * 100).toFixed(1)}%`);

if (testsFailed === 0) {
  console.log("\n🎉 ALL TESTS PASSED! Your MySQLite implementation is complete! 🎉");
} else {
  console.log(`\n⚠️  ${testsFailed} test(s) failed. Please review the errors above.`);
}

// Cleanup
fs.unlinkSync("nba_teams.csv");

console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
