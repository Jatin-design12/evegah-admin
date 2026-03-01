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

const checks = [
  'public.tbl_enum',
  'admin.tbl_admin',
  'masters.tbl_state',
  'masters.tbl_cities',
  'admin.tbl_ride_booking'
];

async function run() {
  await client.connect();

  const sql = `
    select
      current_user as db_user,
      $1::text as table_name,
      has_table_privilege(current_user, $1, 'SELECT') as can_select,
      has_table_privilege(current_user, $1, 'INSERT') as can_insert,
      has_table_privilege(current_user, $1, 'UPDATE') as can_update,
      has_table_privilege(current_user, $1, 'DELETE') as can_delete
  `;

  for (const tableName of checks) {
    try {
      const result = await client.query(sql, [tableName]);
      console.log(result.rows[0]);
    } catch (error) {
      console.error(`check failed for ${tableName}:`, error.message);
    }
  }
}

run()
  .catch((error) => {
    console.error('Privilege check failed:', error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    try {
      await client.end();
    } catch (_) {}
  });
