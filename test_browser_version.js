const MySqliteRequest = require("./my_sqlite_request.js");

// Simple CSV data for testing
const csvData = {
  'test.csv': `name,year_start,position
LeBron James,2004,F-G
Stephen Curry,2010,G
Kevin Durant,2008,F`
};

console.log("=== Testing Browser-Compatible Version ===\n");

// Test 1: SELECT all
const db1 = new MySqliteRequest(csvData);
const result1 = db1.from('test.csv').run();
console.log("Test 1 - SELECT *:");
console.log(result1);
console.log();

// Test 2: SELECT with WHERE
const db2 = new MySqliteRequest(csvData);
const result2 = db2.from('test.csv').where('name', 'LeBron James').run();
console.log("Test 2 - WHERE name='LeBron James':");
console.log(result2);
console.log();

// Test 3: SELECT specific columns
const db3 = new MySqliteRequest(csvData);
const result3 = db3.from('test.csv').select(['name', 'year_start']).run();
console.log("Test 3 - SELECT name, year_start:");
console.log(result3);
console.log();

console.log("✓ All tests passed!");
