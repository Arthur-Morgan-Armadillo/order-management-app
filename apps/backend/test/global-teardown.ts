import { runPrismaCommand } from './prisma-utils';

export default async (): Promise<void> => {
  console.log('Tearing down test database');
  runPrismaCommand(['db', 'seed']);
  console.log('Test database reset');
};
