#!/usr/bin/env node

const { spawnSync } = require('node:child_process');

const action = process.argv[2];
const allowedActions = new Set(['start', 'stop', 'restart', 'status', 'logs', 'setup']);

const config = {
  containerName: process.env.DB_CONTAINER_NAME || 'postgres-test',
  database: process.env.POSTGRES_DB || 'todo_test',
  user: process.env.POSTGRES_USER || 'testuser',
  password: process.env.POSTGRES_PASSWORD || 'testpass',
  port: process.env.POSTGRES_PORT || '5433',
  image: process.env.POSTGRES_IMAGE || 'postgres:15',
};

function usage() {
  console.log('Usage: node scripts/db-test.js <start|stop|restart|status|logs|setup>');
  console.log('Optional env vars: CONTAINER_RUNTIME, DB_CONTAINER_NAME, POSTGRES_DB, POSTGRES_USER, POSTGRES_PASSWORD, POSTGRES_PORT, POSTGRES_IMAGE');
}

if (!allowedActions.has(action)) {
  usage();
  process.exit(1);
}

function commandExists(command) {
  const result = spawnSync(command, ['--version'], { stdio: 'ignore' });
  return result.status === 0;
}

function resolveRuntime() {
  if (process.env.CONTAINER_RUNTIME) {
    return process.env.CONTAINER_RUNTIME;
  }

  if (commandExists('podman')) return 'podman';
  if (commandExists('docker')) return 'docker';

  console.error('No container runtime found. Install Podman or Docker, or set CONTAINER_RUNTIME.');
  process.exit(1);
}

const runtime = resolveRuntime();

function run(args, options = {}) {
  const result = spawnSync(runtime, args, {
    encoding: 'utf8',
    stdio: options.capture ? 'pipe' : 'inherit',
  });

  if (result.status !== 0 && !options.allowFailure) {
    const command = `${runtime} ${args.join(' ')}`;
    const stderr = result.stderr ? `\n${result.stderr.trim()}` : '';
    throw new Error(`Command failed: ${command}${stderr}`);
  }

  return result;
}

function getContainerNames() {
  const result = run(['ps', '-a', '--filter', `name=${config.containerName}`, '--format', '{{.Names}}'], {
    capture: true,
    allowFailure: true,
  });

  if (result.status !== 0) return [];

  return result.stdout
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

function containerExists() {
  return getContainerNames().includes(config.containerName);
}

function ensurePodmanMachine() {
  if (runtime !== 'podman') return;
  if (!['darwin', 'win32'].includes(process.platform)) return;

  const result = spawnSync(runtime, ['machine', 'list', '--format', '{{.Running}}'], {
    encoding: 'utf8',
    stdio: 'pipe',
  });

  if (result.status !== 0) return;

  const isRunning = result.stdout
    .split(/\r?\n/)
    .some((line) => line.trim() === 'true');

  if (!isRunning) {
    console.log('Starting Podman machine...');
    run(['machine', 'start']);
  }
}

function startDatabase() {
  console.log('Starting PostgreSQL test database...');

  if (containerExists()) {
    run(['start', config.containerName]);
  } else {
    console.log('Creating PostgreSQL test database container...');
    run([
      'run',
      '--name', config.containerName,
      '-e', `POSTGRES_DB=${config.database}`,
      '-e', `POSTGRES_USER=${config.user}`,
      '-e', `POSTGRES_PASSWORD=${config.password}`,
      '-p', `${config.port}:5432`,
      '-d',
      config.image,
    ]);
  }

  console.log(`Connection string: postgresql://${config.user}:${config.password}@localhost:${config.port}/${config.database}`);
}

function stopDatabase() {
  console.log('Stopping PostgreSQL test database...');
  run(['stop', config.containerName], { allowFailure: true });
}

function restartDatabase() {
  console.log('Restarting PostgreSQL test database...');

  if (!containerExists()) {
    startDatabase();
    return;
  }

  run(['restart', config.containerName]);
}

function statusDatabase() {
  console.log('PostgreSQL test database status:');
  run(['ps', '-a', '--filter', `name=${config.containerName}`]);
}

function logsDatabase() {
  console.log('PostgreSQL test database logs:');
  run(['logs', config.containerName]);
}

function waitForDatabase() {
  console.log('Waiting for database readiness...');

  for (let attempt = 1; attempt <= 20; attempt += 1) {
    const result = run(
      ['exec', config.containerName, 'pg_isready', '-U', config.user, '-d', config.database],
      { capture: true, allowFailure: true }
    );

    if (result.status === 0) {
      console.log('Database is ready.');
      return;
    }

    Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 1000);
  }

  throw new Error('Database did not become ready in time. Check container logs with npm run db:logs.');
}

function setupDatabase() {
  console.log('Setting up PostgreSQL test environment...');
  ensurePodmanMachine();
  startDatabase();
  waitForDatabase();
  console.log('Database setup complete. You can now run: npm run test:api');
}

try {
  switch (action) {
    case 'start':
      ensurePodmanMachine();
      startDatabase();
      break;
    case 'stop':
      stopDatabase();
      break;
    case 'restart':
      ensurePodmanMachine();
      restartDatabase();
      break;
    case 'status':
      statusDatabase();
      break;
    case 'logs':
      logsDatabase();
      break;
    case 'setup':
      setupDatabase();
      break;
    default:
      usage();
      process.exit(1);
  }
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
