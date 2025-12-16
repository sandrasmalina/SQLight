// Browser-compatible version - no fs module needed

class MySqliteRequest {
  constructor(csvData = {}) {
    this.csvData = csvData; // Object to store CSV content: { filename: csvString }
    this.tableName = null;
    this.selectColumns = null;
    this.whereClause = null;
    this.joinData = null;
    this.orderClause = null;

    this.insertTable = null;
    this.insertValues = null;

    this.updateTable = null;
    this.updateValues = null;

    this.deleteFlag = false;
  }

  // ------------------------------
  // FROM
  // ------------------------------
  from(tableName) {
    this.tableName = tableName;
    return this;
  }

  // ------------------------------
  // SELECT
  // ------------------------------
  select(columns) {
    this.selectColumns = Array.isArray(columns) ? columns : [columns];
    return this;
  }

  // ------------------------------
  // WHERE
  // ------------------------------
  where(column, value) {
    this.whereClause = { column, value };
    return this;
  }

  // ------------------------------
  // JOIN
  // ------------------------------
  join(columnA, filenameB, columnB) {
    this.joinData = { columnA, filenameB, columnB };
    return this;
  }

  // ------------------------------
  // ORDER
  // ------------------------------
  order(direction, column) {
    this.orderClause = { direction, column };
    return this;
  }

  // ------------------------------
  // INSERT
  // ------------------------------
  insert(tableName) {
    this.insertTable = tableName;
    return this;
  }

  values(data) {
    this.insertValues = data;
    return this;
  }

  // ------------------------------
  // UPDATE
  // ------------------------------
  update(tableName) {
    this.updateTable = tableName;
    return this;
  }

  set(data) {
    this.updateValues = data;
    return this;
  }

  // ------------------------------
  // DELETE
  // ------------------------------
  delete() {
    this.deleteFlag = true;
    return this;
  }

  // ------------------------------
  // RUN
  // ------------------------------
  run() {
    if (this.insertTable) return this.runInsert();
    if (this.updateTable) return this.runUpdate();
    if (this.deleteFlag) return this.runDelete();

    return this.runSelect();
  }

  // ------------------------------
  // Helpers
  // ------------------------------
  loadCSV(filename) {
    if (!this.csvData[filename]) {
      throw new Error(`CSV file "${filename}" not loaded. Please load it first.`);
    }
    const raw = this.csvData[filename].trim().split(/\r?\n/);
    const headers = raw[0].split(",");
    return raw.slice(1).map(line => {
      const values = line.split(",");
      const row = {};
      headers.forEach((h, i) => (row[h] = values[i]));
      return row;
    });
  }

  writeCSV(filename, rows) {
    if (rows.length === 0) return;

    const headers = Object.keys(rows[0]);
    const lines = [headers.join(",")];

    rows.forEach(row => {
      lines.push(headers.map(h => row[h]).join(","));
    });

    this.csvData[filename] = lines.join("\n");
  }

  // ------------------------------
  // SELECT
  // ------------------------------
  runSelect() {
    let data = this.loadCSV(this.tableName);

    // JOIN
    if (this.joinData) {
      const joinRows = this.loadCSV(this.joinData.filenameB);

      data = data.flatMap(rowA =>
        joinRows
          .filter(rowB => rowA[this.joinData.columnA] === rowB[this.joinData.columnB])
          .map(rowB => ({ ...rowA, ...rowB }))
      );
    }

    // WHERE
    if (this.whereClause) {
      data = data.filter(row => row[this.whereClause.column] === this.whereClause.value);
    }

    // ORDER
    if (this.orderClause) {
      const { direction, column } = this.orderClause;
      data.sort((a, b) =>
        direction === "desc"
          ? (a[column] > b[column] ? -1 : 1)
          : (a[column] > b[column] ? 1 : -1)
      );
    }

    // SELECT
    if (this.selectColumns) {
      data = data.map(row => {
        const obj = {};
        this.selectColumns.forEach(col => (obj[col] = row[col]));
        return obj;
      });
    }

    return data;
  }

  // ------------------------------
  // INSERT
  // ------------------------------
  runInsert() {
    const table = this.loadCSV(this.insertTable);
    table.push(this.insertValues);
    this.writeCSV(this.insertTable, table);
    return true;
  }

  // ------------------------------
  // UPDATE
  // ------------------------------
  runUpdate() {
    const table = this.loadCSV(this.updateTable);

    table.forEach(row => {
      if (!this.whereClause || row[this.whereClause.column] === this.whereClause.value) {
        Object.keys(this.updateValues).forEach(key => {
          row[key] = this.updateValues[key];
        });
      }
    });

    this.writeCSV(this.updateTable, table);
    return true;
  }

  // ------------------------------
  // DELETE
  // ------------------------------
  runDelete() {
    let table = this.loadCSV(this.tableName);

    table = table.filter(
      row => row[this.whereClause.column] !== this.whereClause.value
    );

    this.writeCSV(this.tableName, table);
    return true;
  }
}

// Support both Node.js and browser environments
if (typeof module !== 'undefined' && module.exports) {
  module.exports = MySqliteRequest;
}
