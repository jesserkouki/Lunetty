import { ApiPropertyOptional } from '@nestjs/swagger';
import { FrameImageReviewStatus } from '@prisma/client';
import { IsEnum, IsOptional } from 'class-validator';
import { PaginationDto } from '../../common/dto/pagination.dto';

export class QueryFrameImageContributionsDto extends PaginationDto {
  @ApiPropertyOptional({ enum: FrameImageReviewStatus })
  @IsOptional()
  @IsEnum(FrameImageReviewStatus)
  reviewStatus?: FrameImageReviewStatus;
}
