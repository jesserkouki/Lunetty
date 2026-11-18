import { BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  PrescriptionsService,
  validatePrescriptionUpload,
} from './prescriptions.service';

describe('PrescriptionsService', () => {
  it('rejects duplicate eye entries before writing prescription data', async () => {
    const prisma = {
      profilClient: {
        upsert: jest.fn().mockResolvedValue({ id: 'profile-id' }),
      },
      ordonnance: { create: jest.fn() },
    };
    const service = new PrescriptionsService(prisma as unknown as PrismaService);

    await expect(
      service.create('owner-id', {
        titre: 'Current prescription',
        yeux: [{ cote: 'GAUCHE' }, { cote: 'GAUCHE' }],
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.ordonnance.create).not.toHaveBeenCalled();
  });

  it('validates prescription uploads using both file signature and size', () => {
    expect(() =>
      validatePrescriptionUpload({
        buffer: Buffer.from('%PDX-not-a-real-file'),
        mimetype: 'application/pdf',
        originalname: 'fake.pdf',
      }),
    ).toThrow(BadRequestException);
    expect(() =>
      validatePrescriptionUpload({
        buffer: Buffer.alloc(10 * 1024 * 1024 + 1),
        mimetype: 'application/pdf',
        originalname: 'large.pdf',
      }),
    ).toThrow(BadRequestException);
    expect(
      validatePrescriptionUpload({
        buffer: Buffer.from('%PDF-1.7'),
        mimetype: 'application/pdf',
        originalname: 'valid.pdf',
      }),
    ).toBe('application/pdf');
  });

  it('does not expose a prescription document that is not owned by the user', async () => {
    const prisma = {
      profilClient: {
        upsert: jest.fn().mockResolvedValue({ id: 'owner-profile' }),
      },
      ordonnance: { findFirst: jest.fn().mockResolvedValue(null) },
    };
    const service = new PrescriptionsService(prisma as unknown as PrismaService);

    await expect(service.file('owner-id', 'other-prescription')).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(prisma.ordonnance.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          id: 'other-prescription',
          profil_client_id: 'owner-profile',
        },
      }),
    );
  });
});
