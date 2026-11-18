import {
  IsBoolean,
  IsIn,
  IsISO8601,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';

export class AdminStatusDto {
  @IsString()
  status!: string;

  @IsString()
  @MaxLength(1000)
  reason!: string;
}

export class AssignPlanDto {
  @IsUUID()
  planId!: string;

  @IsString()
  @MaxLength(1000)
  reason!: string;
}

export class CreateClickDto {
  @IsUUID()
  storeId!: string;

  @IsIn(['STORE_PROFILE', 'STORE_LISTING'])
  type!: 'STORE_PROFILE' | 'STORE_LISTING';

  @IsOptional()
  @IsUUID()
  listingId?: string;
}

export class AdvertisementDto {
  @IsOptional()
  @IsUUID()
  campaignId?: string | null;

  @IsString()
  @MaxLength(160)
  title!: string;

  @IsOptional()
  @IsString()
  description?: string | null;

  @IsOptional()
  @IsUrl({ protocols: ['https'], require_protocol: true })
  imageUrl?: string | null;

  @IsUrl({ protocols: ['https'], require_protocol: true })
  destinationUrl!: string;

  @IsString()
  @MaxLength(160)
  advertiser!: string;

  @IsIn(['BANNER', 'SPONSORED_LISTING', 'PROMOTION'])
  type!: string;

  @IsIn(['DRAFT', 'SCHEDULED', 'ACTIVE', 'PAUSED', 'EXPIRED', 'ARCHIVED'])
  status!: string;

  @IsOptional()
  @IsISO8601()
  startsAt?: string | null;

  @IsOptional()
  @IsISO8601()
  endsAt?: string | null;

  @IsOptional()
  @IsString()
  internalNotes?: string | null;

  @IsString()
  @MaxLength(1000)
  reason!: string;
}

export class CampaignDto {
  @IsString()
  @MaxLength(160)
  name!: string;

  @IsIn(['DRAFT', 'SCHEDULED', 'ACTIVE', 'PAUSED', 'EXPIRED', 'ARCHIVED'])
  status!: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  targetAudience?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(160)
  targetLocation?: string | null;

  @IsOptional()
  @IsISO8601()
  startsAt?: string | null;

  @IsOptional()
  @IsISO8601()
  endsAt?: string | null;

  @IsOptional()
  @IsNumber()
  @Min(0)
  budget?: number | null;

  @IsOptional()
  @IsString()
  internalNotes?: string | null;

  @IsString()
  @MaxLength(1000)
  reason!: string;
}

export class PlatformControlsDto {
  @IsBoolean()
  storeRegistrationsEnabled!: boolean;

  @IsBoolean()
  advertisementsEnabled!: boolean;

  @IsString()
  @MaxLength(1000)
  reason!: string;
}
