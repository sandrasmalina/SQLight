const { execSync } = require("child_process");
const fs = require("fs");

console.log("╔════════════════════════════════════════════════════════════╗");
console.log("║           CLI Version Test Suite - 6 Tests                ║");
console.log("╚════════════════════════════════════════════════════════════╝\n");

// Setup test data
const TEST_FILE = "test_cli_data.csv";
const INITIAL_DATA = `id,name,role
1,Admin,Superuser
2,User,Regular
3,Guest,Visitor`;

fs.writeFileSync(TEST_FILE, INITIAL_DATA);

let testsPassed = 0;
let testsFailed = 0;

function runCli(command) {
    try {
        // Pipe the command to the CLI script
        const output = execSync(`echo "${command}" | node my_sqlite_cli.js`, { encoding: 'utf8' });
        return output;
    } catch (error) {
        throw new Error(`CLI execution failed: ${error.message}`);
    }
}

function test(testNumber, taskName, fn) {
    try {
        console.log(`\n┌─────────────────────────────────────────────────────────┐`);
        console.log(`│ Test ${testNumber}/6: ${taskName.padEnd(49)} │`);
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
// SELECT Tests
// ==========================================
console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
console.log("  SECTION 1: SELECT Operations");
console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

test(1, "SELECT *", () => {
    const output = runCli(`SELECT * FROM ${TEST_FILE}`);
    if (!output.includes("Admin|Superuser")) throw new Error("Missing data in output");
    if (!output.includes("Guest|Visitor")) throw new Error("Missing data in output");
    console.log("   📊 Retrieved all rows successfully");
});

test(2, "SELECT with WHERE", () => {
    const output = runCli(`SELECT * FROM ${TEST_FILE} WHERE id=2`);
    if (output.includes("Admin")) throw new Error("Should not contain Admin");
    if (!output.includes("User|Regular")) throw new Error("Missing expected row");
    console.log("   🔍 Filtered correct row");
});

// ==========================================
// INSERT Tests
// ==========================================
console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
console.log("  SECTION 2: INSERT Operations");
console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

test(3, "INSERT new row", () => {
    runCli(`INSERT INTO ${TEST_FILE} VALUES (4, NewUser, Tester)`);

    const content = fs.readFileSync(TEST_FILE, "utf8");
    if (!content.includes("4,NewUser,Tester")) throw new Error("File was not updated");
    console.log("   ➕ Row added to file");
});

// ==========================================
// UPDATE Tests
// ==========================================
console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
console.log("  SECTION 3: UPDATE Operations");
console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

test(4, "UPDATE existing row", () => {
    runCli(`UPDATE ${TEST_FILE} SET role=Manager WHERE name=User`);

    const content = fs.readFileSync(TEST_FILE, "utf8");
    if (!content.includes("2,User,Manager")) throw new Error("File was not updated correctly");
    if (content.includes("2,User,Regular")) throw new Error("Old data still present");
    console.log("   ✏️  Row updated in file");
});

// ==========================================
// DELETE Tests
// ==========================================
console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
console.log("  SECTION 4: DELETE Operations");
console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

test(5, "DELETE row", () => {
    runCli(`DELETE FROM ${TEST_FILE} WHERE id=3`);

    const content = fs.readFileSync(TEST_FILE, "utf8");
    if (content.includes("Guest")) throw new Error("Row was not deleted");
    console.log("   🗑️  Row removed from file");
});

// ==========================================
// Error Handling
// ==========================================
console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
console.log("  SECTION 5: Error Handling");
console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

test(6, "Unknown Command", () => {
    const output = runCli(`INVALID_COMMAND`);
    if (!output.includes("Unknown command")) throw new Error("Did not report unknown command");
    console.log("   ⚠️  Correctly handled invalid input");
});


// ==========================================
// Summary
// ==========================================
console.log("\n╔════════════════════════════════════════════════════════════╗");
console.log("║                    TEST SUMMARY                            ║");
console.log("╚════════════════════════════════════════════════════════════╝");
console.log(`\n   ✅ Passed: ${testsPassed}/6`);
console.log(`   ❌ Failed: ${testsFailed}/6`);
console.log(`   🎯 Success Rate: ${((testsPassed / 6) * 100).toFixed(1)}%\n`);

// Cleanup
try {
    fs.unlinkSync(TEST_FILE);
} catch (e) { }
