const path = require('path');
const dotenv = require('dotenv');
const { Client } = require('pg');

const envFile = process.env.NODE_ENV === 'production' ? '.env.prod' : '.env.dev';
dotenv.config({ path: path.resolve(process.cwd(), envFile) });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const clean = (value) => String(value || '').trim().replace(/^['\"]|['\"]$/g, '');
const emailArg = process.argv[2] || 'admin@gmail.com';

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

  const sql = `
    select
      id,
      user_name,
      emailid,
      mobile,
      status_enum_id,
      user_type_enum_id,
      case
        when password is null then 'null'
        when password like '$2a$%' or password like '$2b$%' or password like '$2y$%' then 'bcrypt'
        else 'plain-or-other'
      end as password_type,
      length(coalesce(password, '')) as password_length,
      createdon_date,
      updatedon_date
    from admin.tbl_admin
    where lower(trim(emailid)) = lower(trim($1))
    order by id desc
    limit 5
  `;

  const { rows } = await client.query(sql, [emailArg]);

  if (!rows.length) {
    console.log(`No user found for email: ${emailArg}`);
    return;
  }

  console.log(`Found ${rows.length} row(s) for ${emailArg}`);
  for (const row of rows) {
    console.log(row);
  }
}

run()
  .catch((e) => {
    console.error('Check failed:', e.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    try {
      await client.end();
    } catch (_) {}
  });
