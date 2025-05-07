import { PrismaClient, Prisma } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { env } from 'node:process';

const prisma = new PrismaClient();

const userSeedData: Prisma.UserCreateInput[] = [
  {
    name: 'John',
    email: 'john@example.com',
    balance: new Decimal(300),
  },
  {
    name: 'Jane',
    email: 'jane@example.com',
  },
  {
    name: 'Jules',
    email: 'jules@example.com',
    balance: new Decimal(50),
  },
  {
    name: 'Juliet',
    email: 'juliet@example.com',
    balance: new Decimal(500),
  },
  {
    name: 'Jordan',
    email: 'jordan@example.com',
    balance: new Decimal(1500),
  },
];

const productSeedData: Prisma.ProductCreateInput[] = [
  {
    name: 'Phone',
    price: new Decimal(250.25),
    stock: 5,
  },
  {
    name: 'Laptop',
    price: new Decimal(500.5),
    stock: 3,
  },
  {
    name: 'Mouse',
    price: new Decimal(25.0),
    stock: 10,
  },
  {
    name: 'Keyboard',
    price: new Decimal(75.75),
    stock: 10,
  },
  {
    name: 'Monitor',
    price: new Decimal(200.0),
    stock: 5,
  },
];

const main = async () => {
  console.log(`Seeding started`);
  console.log('🌱 Seeding database via', env.NODE_ENV || 'local dev');

  await prisma.order.deleteMany();
  console.log('Deleted records in orders table');
  await prisma.user.deleteMany();
  console.log('Deleted records in users table');
  await prisma.product.deleteMany();
  console.log('Deleted records in products table');

  for (const user of userSeedData) {
    const newUser = await prisma.user.create({
      data: user,
    });
    console.log(`Created user with id: ${newUser.id}`);
  }

  for (const product of productSeedData) {
    const newProduct = await prisma.product.create({
      data: product,
    });
    console.log(`Created product with id: ${newProduct.id}`);
  }

  console.log(`Seeding finished`);
};

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
