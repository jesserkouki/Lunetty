import { validate } from 'class-validator';
import { InventoryQueryDto } from './inventory-query.dto';

describe('InventoryQueryDto', () => {
  it('allows locationId with strict whitelist validation', async () => {
    const query = Object.assign(new InventoryQueryDto(), {
      locationId: '6bfcdee1-0226-4a10-8c10-6b849d5a74c7',
    });

    const errors = await validate(query, {
      whitelist: true,
      forbidNonWhitelisted: true,
    });

    expect(errors).toHaveLength(0);
  });
});
