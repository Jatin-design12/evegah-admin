const path = require('path');
const dotenv = require('dotenv');
const { Client } = require('pg');

const envFile = process.env.NODE_ENV === 'production' ? '.env.prod' : '.env.dev';
dotenv.config({ path: path.resolve(process.cwd(), envFile) });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const clean = (value) => String(value || '').trim().replace(/^['\"]|['\"]$/g, '');

const client = new Client({
  host: clean(process.env.POSTGRE_HOST),
  database: clean(process.env.POSTGRE_DATABASE || process.env.POSTGRE_DATBASE),
  user: clean(process.env.POSTGRE_USER),
  password: clean(process.env.POSTGRE_PASSWORD),
  port: Number(clean(process.env.POSTGRE_PORT || '5432')),
  ssl: false,
});

async function run() {
  await client.connect();

  const counts = await client.query(`
    select table_schema, count(*)::int as table_count
    from information_schema.tables
    where table_type='BASE TABLE'
      and table_schema not in ('pg_catalog','information_schema')
    group by table_schema
    order by table_schema;
  `);

  console.log('Table counts by schema:');
  for (const row of counts.rows) {
    console.log(`${row.table_schema}: ${row.table_count}`);
  }

  const owners = await client.query(`
    select n.nspname as schema_name, c.relname as table_name, pg_get_userbyid(c.relowner) as owner_name
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where c.relkind = 'r'
      and n.nspname in ('admin','masters','inventory','shop','public')
    order by n.nspname, c.relname
    limit 40;
  `);

  console.log('\nSample table ownership:');
  for (const row of owners.rows) {
    console.log(`${row.schema_name}.${row.table_name} -> ${row.owner_name}`);
  }
}

run()
  .catch((e) => {
    console.error('DB state check failed:', e.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    try {
      await client.end();
    } catch (_) {}
  });
