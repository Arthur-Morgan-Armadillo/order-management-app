import { runPrismaCommand } from './prisma-utils';

export default async (): Promise<void> => {
  console.log('Setting up test database');

  runPrismaCommand(['migrate', 'deploy']);
  runPrismaCommand(['db', 'seed']);

  console.log('Test database ready');
};
