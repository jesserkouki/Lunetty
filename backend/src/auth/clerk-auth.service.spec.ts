import { ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PasswordHasher } from './password-hasher.service';
import { ClerkAuthService } from './clerk-auth.service';
import { ClerkIdentityService } from './clerk-identity.service';

const profile = {
  clerkUserId: 'user_clerk-1',
  email: 'new.member@example.com',
  firstName: 'New',
  lastName: 'Member',
  imageUrl: 'https://images.example.com/avatar.png',
};

describe('ClerkAuthService', () => {
  it('creates an active default-role user from the verified Clerk profile', async () => {
    const createdUser = { id: 'db-user-1', email: profile.email };
    const transaction = {
      utilisateur: {
        findUnique: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockResolvedValue(createdUser),
      },
    };
    const prisma = {
      $transaction: jest.fn(
        (callback: (tx: typeof transaction) => Promise<unknown>) =>
          callback(transaction),
      ),
    };
    const service = new ClerkAuthService(
      prisma as unknown as PrismaService,
      { hash: jest.fn().mockResolvedValue('scrypt$random$hash') } as unknown as PasswordHasher,
      {
        verifySessionToken: jest.fn().mockResolvedValue(profile.clerkUserId),
        getVerifiedProfile: jest.fn().mockResolvedValue(profile),
      } as unknown as ClerkIdentityService,
    );

    await expect(service.synchronize('clerk-session-token')).resolves.toEqual(
      createdUser,
    );
    expect(transaction.utilisateur.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          clerk_user_id: profile.clerkUserId,
          email: profile.email,
          prenom: profile.firstName,
          nom: profile.lastName,
          statut: 'ACTIVE',
          email_verifie_le: expect.any(Date),
        }),
      }),
    );
  });

  it('creates an optician role for a new Clerk pro signup', async () => {
    const transaction = {
      utilisateur: {
        findUnique: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockResolvedValue({ id: 'optician-user' }),
      },
    };
    const prisma = {
      $transaction: jest.fn(
        (callback: (tx: typeof transaction) => Promise<unknown>) =>
          callback(transaction),
      ),
    };
    const service = new ClerkAuthService(
      prisma as unknown as PrismaService,
      { hash: jest.fn().mockResolvedValue('scrypt$random$hash') } as unknown as PasswordHasher,
      {
        verifySessionToken: jest.fn().mockResolvedValue(profile.clerkUserId),
        getVerifiedProfile: jest.fn().mockResolvedValue(profile),
      } as unknown as ClerkIdentityService,
    );

    await service.synchronize('clerk-session-token', 'OPTICIAN');
    expect(transaction.utilisateur.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ role: 'OPTICIEN' }),
      }),
    );
  });

  it('reuses the existing Clerk-linked user without creating a duplicate', async () => {
    const linkedUser = {
      id: 'db-user-1',
      clerk_user_id: profile.clerkUserId,
      email: profile.email,
      email_verifie_le: null,
      statut: 'ACTIVE',
      supprime_le: null,
    };
    const transaction = {
      utilisateur: {
        findUnique: jest.fn().mockResolvedValueOnce(linkedUser),
        update: jest.fn().mockResolvedValue({ id: linkedUser.id }),
        create: jest.fn(),
      },
    };
    const prisma = {
      $transaction: jest.fn(
        (callback: (tx: typeof transaction) => Promise<unknown>) =>
          callback(transaction),
      ),
    };
    const service = new ClerkAuthService(
      prisma as unknown as PrismaService,
      {} as PasswordHasher,
      {
        verifySessionToken: jest.fn().mockResolvedValue(profile.clerkUserId),
        getVerifiedProfile: jest.fn().mockResolvedValue(profile),
      } as unknown as ClerkIdentityService,
    );

    await expect(service.synchronize('clerk-session-token')).resolves.toEqual({
      id: linkedUser.id,
    });
    expect(transaction.utilisateur.create).not.toHaveBeenCalled();
  });

  it('does not attach a Clerk identity to an email already linked elsewhere', async () => {
    const transaction = {
      utilisateur: {
        findUnique: jest
          .fn()
          .mockResolvedValueOnce(null)
          .mockResolvedValueOnce({
            id: 'db-user-1',
            clerk_user_id: 'user_different-clerk',
            statut: 'ACTIVE',
            supprime_le: null,
          }),
        create: jest.fn(),
      },
    };
    const prisma = {
      $transaction: jest.fn(
        (callback: (tx: typeof transaction) => Promise<unknown>) =>
          callback(transaction),
      ),
    };
    const service = new ClerkAuthService(
      prisma as unknown as PrismaService,
      {} as PasswordHasher,
      {
        verifySessionToken: jest.fn().mockResolvedValue(profile.clerkUserId),
        getVerifiedProfile: jest.fn().mockResolvedValue(profile),
      } as unknown as ClerkIdentityService,
    );

    await expect(
      service.synchronize('clerk-session-token'),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(transaction.utilisateur.create).not.toHaveBeenCalled();
  });
});
