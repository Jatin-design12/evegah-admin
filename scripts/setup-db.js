const fs = require('fs');
require('dotenv').config({ path: '.env.dev' });
const { Client } = require('pg');

const clean = (v) => String(v || '').trim().replace(/^['\"]|['\"]$/g, '');

const client = new Client({
  host: clean(process.env.POSTGRE_HOST),
  database: clean(process.env.POSTGRE_DATABASE),
  user: clean(process.env.POSTGRE_USER),
  password: clean(process.env.POSTGRE_PASSWORD),
  port: Number(clean(process.env.POSTGRE_PORT) || 5432),
  ssl: false,
});

async function run() {
  await client.connect();
  const ping = await client.query('select current_database() as db, current_user as usr');
  console.log('Connected:', ping.rows[0]);

  const sql = fs.readFileSync('scripts/create-admin-table.sql', 'utf8');
  await client.query(sql);
  console.log('Executed scripts/create-admin-table.sql');

  const tables = await client.query(`
    select table_schema, table_name
    from information_schema.tables
    where table_type='BASE TABLE'
      and table_schema not in ('pg_catalog','information_schema')
    order by table_schema, table_name
    limit 500
  `);

  console.log('Tables found:', tables.rowCount);
  for (const row of tables.rows) {
    console.log(`${row.table_schema}.${row.table_name}`);
  }
}

run()
  .catch((e) => {
    console.error('DB setup failed:', e.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    try {
      await client.end();
    } catch (e) {
      // ignore close errors
    }
  });
