// Quasar Component Example
// How to use MySqliteRequest in a Quasar component

<template>
  <q-page class="q-pa-md">
    <h4>MySQLite Query Results</h4>
    
    <q-select
      v-model="selectedQuery"
      :options="queryOptions"
      label="Select Query"
      @update:model-value="runQuery"
    />

    <q-table
      :rows="results"
      :columns="columns"
      row-key="name"
      class="q-mt-md"
    />
  </q-page>
</template>

<script>
import { ref } from 'vue';
// Import your MySqliteRequest class
// Make sure the file is in your src folder or properly imported

export default {
  name: 'MySqlitePage',
  
  setup() {
    const selectedQuery = ref('all');
    const results = ref([]);
    const columns = ref([]);
    
    // Your CSV data - in a real app, you might load this from an API or file
    const csvData = {
      'nba_player_data.csv': `name,year_start,year_end,position,height,weight,birth_date,college
Alaa Abdelnaby,1991,1995,F-C,6-10,240,June 24 1968,Duke
LeBron James,2004,2018,F-G,6-8,250,December 30 1984,
Stephen Curry,2010,2018,G,6-3,190,March 14 1988,Davidson
Kevin Durant,2008,2018,F,6-9,240,September 29 1988,Texas`
    };

    const queryOptions = [
      { label: 'All Players', value: 'all' },
      { label: 'LeBron James', value: 'lebron' },
      { label: 'Order by Year', value: 'ordered' }
    ];

    const runQuery = (option) => {
      const db = new MySqliteRequest(csvData);
      
      switch(option.value) {
        case 'all':
          results.value = db.from('nba_player_data.csv').run();
          break;
          
        case 'lebron':
          results.value = db
            .from('nba_player_data.csv')
            .where('name', 'LeBron James')
            .run();
          break;
          
        case 'ordered':
          results.value = db
            .from('nba_player_data.csv')
            .select(['name', 'year_start'])
            .order('desc', 'year_start')
            .run();
          break;
      }
      
      // Update columns based on results
      if (results.value.length > 0) {
        columns.value = Object.keys(results.value[0]).map(key => ({
          name: key,
          label: key.toUpperCase(),
          field: key,
          align: 'left'
        }));
      }
    };

    // Run initial query
    runQuery({ value: 'all' });

    return {
      selectedQuery,
      queryOptions,
      results,
      columns,
      runQuery
    };
  }
};
</script>
