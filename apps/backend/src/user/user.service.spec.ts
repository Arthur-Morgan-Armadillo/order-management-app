import { Test, TestingModule } from '@nestjs/testing';
import { Prisma, User } from '@prisma/client';
import { jest, describe, it, beforeEach, expect } from '@jest/globals';
import { UserService } from './user.service';
import { UserRepository } from './user.repository';
import { IUser } from '@shared/interfaces';

const mockPrismaUsers: User[] = [
  {
    id: 'user-uuid-1',
    name: 'Alice',
    email: 'alice@example.com',
    balance: new Prisma.Decimal(150.75),
  },
  {
    id: 'user-uuid-2',
    name: 'Bob',
    email: 'bob@example.com',
    balance: new Prisma.Decimal(50.0),
  },
];

interface UserRepositoryMock {
  findAllUsers: jest.Mock<() => Promise<typeof mockPrismaUsers>>;
}

const createMockRepository = (): UserRepositoryMock => ({
  findAllUsers: jest.fn(),
});

describe('UserService', () => {
  let service: UserService;
  let repositoryMock: UserRepositoryMock;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: UserRepository,
          useValue: createMockRepository(),
        },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
    repositoryMock = module.get<UserRepositoryMock>(UserRepository);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getAllUsers', () => {
    it('should return an array of users with balances as strings formatted to 2 decimal places', async () => {
      const expectedUsers: IUser[] = [
        {
          id: 'user-uuid-1',
          name: 'Alice',
          email: 'alice@example.com',
          balance: '150.75',
        },
        {
          id: 'user-uuid-2',
          name: 'Bob',
          email: 'bob@example.com',
          balance: '50.00',
        },
      ];

      repositoryMock.findAllUsers.mockResolvedValue(mockPrismaUsers);
      const result = await service.getAllUsers();

      expect(repositoryMock.findAllUsers).toHaveBeenCalledTimes(1);
      expect(result).toEqual(expectedUsers);
      expect(result[0].balance).toBe('150.75');
      expect(result[1].balance).toBe('50.00');
    });

    it('should throw NotFoundException if repository returns an empty array', async () => {
      repositoryMock.findAllUsers.mockResolvedValue([]);

      await expect(service.getAllUsers()).rejects.toMatchObject({
        name: 'NotFoundException',
        message: 'No users found',
      });
      expect(repositoryMock.findAllUsers).toHaveBeenCalledTimes(1);
    });

    it('should re-throw an error if repository throws an error', async () => {
      const dbError = new Error('Database connection error');
      repositoryMock.findAllUsers.mockRejectedValue(dbError);

      await expect(service.getAllUsers()).rejects.toThrow(dbError);
      expect(repositoryMock.findAllUsers).toHaveBeenCalledTimes(1);
    });
  });
});
