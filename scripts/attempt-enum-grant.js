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

(async () => {
  try {
    await client.connect();
    await client.query('GRANT SELECT ON TABLE public.tbl_enum TO evegah_user');
    console.log('grant succeeded');
  } catch (error) {
    console.error('grant failed:', error.message);
    process.exitCode = 1;
  } finally {
    try {
      await client.end();
    } catch (_) {}
  }
})();
