const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');
const dotenv = require('dotenv');

const envFile = process.env.NODE_ENV === 'production' ? '.env.prod' : '.env.dev';
dotenv.config({ path: path.resolve(process.cwd(), envFile) });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const clean = (value) => String(value || '').trim().replace(/^['\"]|['\"]$/g, '');

const dumpFile = process.argv[2] || 'dump-eVegahDev-202602230957.sql';
const dumpPath = path.resolve(process.cwd(), dumpFile);

const host = clean(process.env.POSTGRE_HOST);
const database = clean(process.env.POSTGRE_DATABASE || process.env.POSTGRE_DATBASE);
const user = clean(process.env.POSTGRE_USER);
const password = clean(process.env.POSTGRE_PASSWORD);
const port = clean(process.env.POSTGRE_PORT || '5432');

function resolvePgRestoreBin() {
  if (process.platform !== 'win32') {
    return 'pg_restore';
  }

  const winCandidates = [
    'C:/Program Files/PostgreSQL/18/bin/pg_restore.exe',
    'C:/Program Files/PostgreSQL/17/bin/pg_restore.exe',
    'C:/Program Files/PostgreSQL/16/bin/pg_restore.exe',
    'C:/Program Files/PostgreSQL/15/bin/pg_restore.exe',
    'C:/Program Files/PostgreSQL/14/bin/pg_restore.exe',
  ];

  const found = winCandidates.find((candidate) => fs.existsSync(candidate));
  return found || 'pg_restore';
}

if (!host || !database || !user || !password) {
  console.error('Missing DB env vars. Expected POSTGRE_HOST, POSTGRE_DATABASE, POSTGRE_USER, POSTGRE_PASSWORD');
  process.exit(1);
}

const args = [
  '--verbose',
  '--no-owner',
  '--no-privileges',
  '--host',
  host,
  '--port',
  port,
  '--username',
  user,
  '--dbname',
  database,
  dumpPath,
];

console.log(`Restoring dump: ${dumpPath}`);
console.log(`Target DB: ${host}:${port}/${database} as ${user}`);

const pgRestoreBin = resolvePgRestoreBin();

const child = spawn(pgRestoreBin, args, {
  stdio: 'inherit',
  env: {
    ...process.env,
    PGPASSWORD: password,
  },
});

child.on('error', (error) => {
  console.error('Failed to run pg_restore. Install PostgreSQL client tools and ensure pg_restore is in PATH.');
  console.error(error.message);
  process.exit(1);
});

child.on('close', (code) => {
  if (code === 0) {
    console.log('Restore completed successfully.');
  } else {
    console.error(`Restore failed with exit code ${code}.`);
    process.exit(code || 1);
  }
});
