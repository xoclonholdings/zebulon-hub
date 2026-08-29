import { spawnSync } from 'node:child_process';

const baselineMigration = '20260813120000_zcos_core';
const baselineSql = `prisma/migrations/${baselineMigration}/migration.sql`;
const fileAuthorityMigration = '20260824200000_file_authority';
const fileAuthorityRepairSql = `prisma/migrations/${fileAuthorityMigration}/repair.sql`;

function run(args, { allowFailure = false } = {}) {
  const result = spawnSync('npx', args, {
    stdio: allowFailure ? 'pipe' : 'inherit',
    encoding: 'utf8',
    env: process.env,
  });

  if (!allowFailure && result.status !== 0) process.exit(result.status ?? 1);
  return result;
}

const deploy = run(['prisma', 'migrate', 'deploy'], { allowFailure: true });
if (deploy.status === 0) {
  process.stdout.write(deploy.stdout || '');
  process.stderr.write(deploy.stderr || '');
  process.exit(0);
}

const output = `${deploy.stdout || ''}\n${deploy.stderr || ''}`;
if (output.includes('P3009') && output.includes(fileAuthorityMigration)) {
  console.log('Completing the interrupted ZCOS file-authority migration...');
  run(['prisma', 'db', 'execute', '--file', fileAuthorityRepairSql, '--schema', 'prisma/schema.prisma']);
  run(['prisma', 'migrate', 'resolve', '--applied', fileAuthorityMigration]);
  run(['prisma', 'migrate', 'deploy']);
  process.exit(0);
}

if (!output.includes('P3005')) {
  process.stdout.write(deploy.stdout || '');
  process.stderr.write(deploy.stderr || '');
  process.exit(deploy.status ?? 1);
}

console.log('Existing Zebulon schema detected. Applying the idempotent ZCOS baseline...');
run(['prisma', 'db', 'execute', '--file', baselineSql, '--schema', 'prisma/schema.prisma']);

const resolve = run(['prisma', 'migrate', 'resolve', '--applied', baselineMigration], { allowFailure: true });
const resolveOutput = `${resolve.stdout || ''}\n${resolve.stderr || ''}`;
if (resolve.status !== 0 && !resolveOutput.includes('P3008')) {
  process.stdout.write(resolve.stdout || '');
  process.stderr.write(resolve.stderr || '');
  process.exit(resolve.status ?? 1);
}

console.log('ZCOS baseline recorded. Applying remaining migrations...');
run(['prisma', 'migrate', 'deploy']);
