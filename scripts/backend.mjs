import { spawn, spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const backendRoot = resolve(repositoryRoot, 'backend');
const python = process.platform === 'win32'
  ? resolve(backendRoot, '.venv', 'Scripts', 'python.exe')
  : resolve(backendRoot, '.venv', 'bin', 'python');
const action = process.argv[2];

function run(command, args, cwd = repositoryRoot) {
  const result = spawnSync(command, args, { cwd, stdio: 'inherit' });
  if (result.error) {
    console.error(result.error.message);
    return 1;
  }
  return result.status ?? 1;
}

if (action === 'setup') {
  if (!existsSync(python)) {
    const createVenv = process.platform === 'win32'
      ? ['-3', '-m', 'venv', resolve(backendRoot, '.venv')]
      : ['-m', 'venv', resolve(backendRoot, '.venv')];
    const createStatus = run(process.platform === 'win32' ? 'py' : 'python3', createVenv);
    if (createStatus !== 0) process.exit(createStatus);
  }
  process.exit(run(python, ['-m', 'pip', 'install', '-r', 'requirements.txt'], backendRoot));
}

if (!existsSync(python)) {
  console.error('Backend virtual environment not found. Run "npm run setup:backend" first.');
  process.exit(1);
}

const commands = {
  dev: ['-m', 'uvicorn', 'app.main:app', '--reload', '--port', '8000'],
  build: ['-m', 'compileall', '-q', 'app'],
  test: ['-m', 'pytest', '-q'],
};

if (!commands[action]) {
  console.error(`Unknown backend command: ${action || '(empty)'}`);
  process.exit(2);
}

if (action === 'dev') {
  const server = spawn(python, commands.dev, { cwd: backendRoot, stdio: 'inherit' });
  process.on('SIGINT', () => server.kill('SIGINT'));
  process.on('SIGTERM', () => server.kill('SIGTERM'));
  server.on('error', (error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
  server.on('exit', (code, signal) => {
    process.exitCode = code ?? (signal ? 1 : 0);
  });
} else {
  process.exit(run(python, commands[action], backendRoot));
}