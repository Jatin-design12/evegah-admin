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

  const base = await client.query(`
    select current_database() as database_name, current_user as user_name, inet_server_addr()::text as server_ip, inet_server_port() as server_port
  `);
  console.log('Connection:', base.rows[0]);

  const schemaPrivs = await client.query(`
    select
      n.nspname as schema_name,
      has_schema_privilege(current_user, n.oid, 'USAGE') as has_usage,
      has_schema_privilege(current_user, n.oid, 'CREATE') as has_create
    from pg_namespace n
    where n.nspname in ('admin', 'masters', 'shop', 'public', 'inventory')
    order by n.nspname
  `);

  console.log('Schema privileges:');
  for (const row of schemaPrivs.rows) {
    console.log(`${row.schema_name}: usage=${row.has_usage}, create=${row.has_create}`);
  }
}

run()
  .catch((e) => {
    console.error('DB check failed:', e.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    try {
      await client.end();
    } catch (e) {
      // ignore
    }
  });
