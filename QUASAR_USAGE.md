# MySQLite - Browser/Quasar Compatible Version

## ✅ Fixed for Quasar!

The code has been updated to work in **browser environments** (including Quasar) without requiring Node.js `fs` module.

## What Changed?

### Before (Node.js only):
```javascript
const fs = require("fs");  // ❌ Doesn't work in browser
```

### After (Browser compatible):
```javascript
// ✅ Works in both Node.js and browser
// No fs module needed!
```

## How to Use in Quasar

### 1. Copy the file
Copy `my_sqlite_request.js` to your Quasar project (e.g., `src/utils/` or `src/lib/`)

### 2. Prepare your CSV data
Instead of reading from files, pass CSV data as a string:

```javascript
const csvData = {
  'players.csv': `name,year_start,position
LeBron James,2004,F-G
Stephen Curry,2010,G
Kevin Durant,2008,F`
};
```

### 3. Create instance and query
```javascript
// Create instance with CSV data
const db = new MySqliteRequest(csvData);

// Run queries
const result = db
  .from('players.csv')
  .select(['name', 'year_start'])
  .where('name', 'LeBron James')
  .run();

console.log(result);
// Output: [{ name: 'LeBron James', year_start: '2004' }]
```

## Complete Quasar Example

```vue
<template>
  <q-page class="q-pa-md">
    <h4>Player Search</h4>
    <q-table :rows="players" :columns="columns" />
  </q-page>
</template>

<script>
import { ref, onMounted } from 'vue';
import MySqliteRequest from 'src/utils/my_sqlite_request.js';

export default {
  setup() {
    const players = ref([]);
    
    const csvData = {
      'players.csv': `name,year_start,position
LeBron James,2004,F-G
Stephen Curry,2010,G
Kevin Durant,2008,F`
    };

    onMounted(() => {
      const db = new MySqliteRequest(csvData);
      players.value = db
        .from('players.csv')
        .select(['name', 'year_start'])
        .order('desc', 'year_start')
        .run();
    });

    const columns = [
      { name: 'name', label: 'Name', field: 'name', align: 'left' },
      { name: 'year_start', label: 'Year', field: 'year_start', align: 'left' }
    ];

    return { players, columns };
  }
};
</script>
```

## Loading CSV from File/API

If you need to load CSV from a file or API:

```javascript
// Option 1: Fetch from API
async function loadCSV() {
  const response = await fetch('/api/players.csv');
  const csvText = await response.text();
  
  const csvData = { 'players.csv': csvText };
  const db = new MySqliteRequest(csvData);
  return db.from('players.csv').run();
}

// Option 2: Load from file input
function handleFileUpload(event) {
  const file = event.target.files[0];
  const reader = new FileReader();
  
  reader.onload = (e) => {
    const csvData = { [file.name]: e.target.result };
    const db = new MySqliteRequest(csvData);
    const results = db.from(file.name).run();
    console.log(results);
  };
  
  reader.readAsText(file);
}
```

## All Available Methods

```javascript
const db = new MySqliteRequest(csvData);

// SELECT
db.from('table.csv').run()
db.from('table.csv').select(['col1', 'col2']).run()

// WHERE
db.from('table.csv').where('column', 'value').run()

// ORDER
db.from('table.csv').order('asc', 'column').run()
db.from('table.csv').order('desc', 'column').run()

// INSERT
db.insert('table.csv').values({ col1: 'val1', col2: 'val2' }).run()

// UPDATE
db.update('table.csv').set({ col1: 'newval' }).where('id', '1').run()

// DELETE
db.from('table.csv').where('id', '1').delete().run()

// JOIN
db.from('table1.csv').join('col1', 'table2.csv', 'col2').run()
```

## Testing

Run the test file to verify everything works:
```bash
node test_browser_version.js
```

## Files

- `my_sqlite_request.js` - Main class (browser-compatible)
- `browser_example.html` - Standalone HTML example
- `quasar_example.vue` - Quasar component example
- `test_browser_version.js` - Test file

---

**No more `require("fs")` errors!** 🎉
