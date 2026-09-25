import { randomUUID } from 'node:crypto';
import { mkdirSync, renameSync, unlinkSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';

export function writeJsonFileAtomic(file: string, value: unknown): void {
  mkdirSync(dirname(file), { recursive: true });
  const temporaryFile = `${file}.${process.pid}.${randomUUID()}.tmp`;
  try {
    writeFileSync(temporaryFile, `${JSON.stringify(value, null, 2)}\n`, { encoding: 'utf8', mode: 0o600 });
    renameSync(temporaryFile, file);
  } catch (error) {
    try {
      unlinkSync(temporaryFile);
    } catch {
      // The temporary file may not exist if creation itself failed.
    }
    throw error;
  }
}
