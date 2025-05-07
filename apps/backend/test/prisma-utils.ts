import { spawnSync } from 'node:child_process';
import { platform } from 'node:os';
import { join } from 'node:path';

export const runPrismaCommand = (args: string[]): void => {
  const isWindows = platform() === 'win32';

  const prismaPath = join(
    process.cwd(),
    '..',
    '..',
    'node_modules',
    '.bin',
    isWindows ? 'prisma.cmd' : 'prisma',
  );

  const result = spawnSync(prismaPath, args, {
    cwd: join(process.cwd()),
    stdio: 'inherit',
    shell: false,
  });

  if (result.error) throw result.error;
  if (result.status !== 0) {
    throw new Error(`Prisma command failed with exit code ${result.status}`);
  }
};
