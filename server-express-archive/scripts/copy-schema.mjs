import { copyFile, mkdir } from 'node:fs/promises';

await mkdir(new URL('../dist/db/', import.meta.url), { recursive: true });
await copyFile(
  new URL('../src/db/schema.sql', import.meta.url),
  new URL('../dist/db/schema.sql', import.meta.url),
);
