import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { SuperAdminGuard } from '../auth/super-admin.guard';
import { AuthenticatedRequest } from '../auth/auth.types';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuditQueryDto } from './dto/audit-query.dto';
import {
  AdminDirectoryQueryDto,
  AdminOrdersQueryDto,
} from './dto/admin-directory-query.dto';
import {
  AdminStatusDto,
  AssignPlanDto,
  CreateClickDto,
  AdvertisementDto,
  CampaignDto,
  PlatformControlsDto,
} from './dto/admin-actions.dto';
import { ModerateReviewDto } from './dto/moderate-review.dto';
import { AdminService } from './admin.service';

@UseGuards(JwtAuthGuard, SuperAdminGuard)
@ApiBearerAuth()
@ApiTags('Platform Administration')
@Controller('admin')
export class AdminController {
  constructor(private readonly admin: AdminService) {}

  @Get('overview')
  @ApiOperation({ summary: 'Get platform-wide administrative metrics' })
  overview() {
    return this.admin.overview();
  }

  @Get('stores')
  @ApiOperation({ summary: 'List shops with owners and operational totals' })
  stores(@Query() query: AdminDirectoryQueryDto) {
    return this.admin.storesDirectory(query);
  }

  @Get('users')
  @ApiOperation({ summary: 'List clients, opticians, and employees' })
  users(@Query() query: AdminDirectoryQueryDto) {
    return this.admin.usersDirectory(query);
  }

  @Get('orders')
  @ApiOperation({ summary: 'List platform orders' })
  orders(@Query() query: AdminOrdersQueryDto) {
    return this.admin.ordersDirectory(query);
  }

  @Get('clicks')
  @ApiOperation({ summary: 'List shop profile and listing click totals' })
  clicks(@Query() query: AdminDirectoryQueryDto) {
    return this.admin.clickStats(query);
  }

  @Get('ai-usage')
  @ApiOperation({ summary: 'Show monthly AI usage by shop and user' })
  aiUsage() {
    return this.admin.aiUsage();
  }

  @Get('plans')
  @ApiOperation({ summary: 'List subscription plans and assignments' })
  plans() {
    return this.admin.plans();
  }

  @Post('plans')
  @ApiOperation({ summary: 'Create a subscription plan' })
  createPlan(
    @CurrentUser() user: AuthenticatedRequest['user'],
    @Body() input: unknown,
  ) {
    return this.admin.createPlan(user.id, input);
  }

  @Patch('plans/:planId')
  @ApiOperation({ summary: 'Update a subscription plan' })
  updatePlan(
    @CurrentUser() user: AuthenticatedRequest['user'],
    @Param('planId', ParseUUIDPipe) planId: string,
    @Body() input: unknown,
  ) {
    return this.admin.updatePlan(user.id, planId, input);
  }

  @Put('stores/:storeId/plan')
  @ApiOperation({ summary: 'Assign a plan to a shop' })
  assignStorePlan(
    @CurrentUser() user: AuthenticatedRequest['user'],
    @Param('storeId', ParseUUIDPipe) storeId: string,
    @Body() input: AssignPlanDto,
  ) {
    return this.admin.assignStorePlan(user.id, storeId, input.planId, input.reason);
  }

  @Delete('stores/:storeId/plan')
  @ApiOperation({ summary: 'Remove a shop subscription assignment' })
  removeStorePlan(
    @CurrentUser() user: AuthenticatedRequest['user'],
    @Param('storeId', ParseUUIDPipe) storeId: string,
    @Body() input: AssignPlanDto,
  ) {
    return this.admin.removeStorePlan(user.id, storeId, input.reason);
  }

  @Put('users/:userId/plan')
  @ApiOperation({ summary: 'Assign a plan to a user' })
  assignUserPlan(
    @CurrentUser() user: AuthenticatedRequest['user'],
    @Param('userId', ParseUUIDPipe) userId: string,
    @Body() input: AssignPlanDto,
  ) {
    return this.admin.assignUserPlan(user.id, userId, input.planId, input.reason);
  }

  @Delete('users/:userId/plan')
  @ApiOperation({ summary: 'Remove a user subscription assignment' })
  removeUserPlan(
    @CurrentUser() user: AuthenticatedRequest['user'],
    @Param('userId', ParseUUIDPipe) userId: string,
    @Body() input: AssignPlanDto,
  ) {
    return this.admin.removeUserPlan(user.id, userId, input.reason);
  }

  @Patch('stores/:storeId/status')
  @ApiOperation({ summary: 'Change a shop platform status' })
  updateStoreStatus(
    @CurrentUser() user: AuthenticatedRequest['user'],
    @Param('storeId', ParseUUIDPipe) storeId: string,
    @Body() input: AdminStatusDto,
  ) {
    return this.admin.updateStoreStatus(user.id, storeId, input.status, input.reason);
  }

  @Patch('users/:userId/status')
  @ApiOperation({ summary: 'Change a user platform status' })
  updateUserStatus(
    @CurrentUser() user: AuthenticatedRequest['user'],
    @Param('userId', ParseUUIDPipe) userId: string,
    @Body() input: AdminStatusDto,
  ) {
    return this.admin.updateUserStatus(user.id, userId, input.status, input.reason);
  }

  @Get('audit-logs')
  @ApiOperation({ summary: 'List platform and shop audit events (ADMIN)' })
  auditLogs(@Query() query: AuditQueryDto) {
    return this.admin.auditLogs(query);
  }

  @Patch('product-reviews/:reviewId')
  @ApiOperation({ summary: 'Moderate a product review (SUPER_ADMIN)' })
  @ApiParam({ name: 'reviewId', format: 'uuid' })
  moderateProductReview(
    @CurrentUser() user: AuthenticatedRequest['user'],
    @Param('reviewId', ParseUUIDPipe) reviewId: string,
    @Body() input: ModerateReviewDto,
  ) {
    return this.admin.moderateProductReview(user.id, reviewId, input.statut);
  }

  @Patch('store-reviews/:reviewId')
  @ApiOperation({ summary: 'Moderate a store review (SUPER_ADMIN)' })
  @ApiParam({ name: 'reviewId', format: 'uuid' })
  moderateStoreReview(
    @CurrentUser() user: AuthenticatedRequest['user'],
    @Param('reviewId', ParseUUIDPipe) reviewId: string,
    @Body() input: ModerateReviewDto,
  ) {
    return this.admin.moderateStoreReview(user.id, reviewId, input.statut);
  }

  @Get('advertisements')
  @ApiOperation({ summary: 'List platform advertisement campaigns and creatives' })
  advertisements() {
    return this.admin.advertisements();
  }

  @Post('advertisements')
  @ApiOperation({ summary: 'Create a platform advertisement' })
  createAdvertisement(
    @CurrentUser() user: AuthenticatedRequest['user'],
    @Body() input: AdvertisementDto,
  ) {
    return this.admin.createAdvertisement(user.id, input);
  }

  @Patch('advertisements/:advertisementId')
  @ApiOperation({ summary: 'Update or archive a platform advertisement' })
  updateAdvertisement(
    @CurrentUser() user: AuthenticatedRequest['user'],
    @Param('advertisementId', ParseUUIDPipe) advertisementId: string,
    @Body() input: AdvertisementDto,
  ) {
    return this.admin.updateAdvertisement(user.id, advertisementId, input);
  }

  @Get('advertisement-campaigns')
  @ApiOperation({ summary: 'List platform advertisement campaigns' })
  advertisementCampaigns() {
    return this.admin.advertisementCampaigns();
  }

  @Post('advertisement-campaigns')
  @ApiOperation({ summary: 'Create an advertisement campaign' })
  createAdvertisementCampaign(
    @CurrentUser() user: AuthenticatedRequest['user'],
    @Body() input: CampaignDto,
  ) {
    return this.admin.createAdvertisementCampaign(user.id, input);
  }

  @Patch('advertisement-campaigns/:campaignId')
  @ApiOperation({ summary: 'Update an advertisement campaign' })
  updateAdvertisementCampaign(
    @CurrentUser() user: AuthenticatedRequest['user'],
    @Param('campaignId', ParseUUIDPipe) campaignId: string,
    @Body() input: CampaignDto,
  ) {
    return this.admin.updateAdvertisementCampaign(user.id, campaignId, input);
  }

  @Get('platform-controls')
  @ApiOperation({ summary: 'Read platform emergency controls' })
  platformControls() {
    return this.admin.platformControls();
  }

  @Patch('platform-controls')
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @ApiOperation({ summary: 'Update platform emergency controls' })
  updatePlatformControls(
    @CurrentUser() user: AuthenticatedRequest['user'],
    @Body() input: PlatformControlsDto,
  ) {
    return this.admin.updatePlatformControls(user.id, input);
  }
}

@Controller('analytics')
@ApiTags('Analytics')
export class PublicClickController {
  constructor(private readonly admin: AdminService) {}

  @Post('clicks')
  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  @ApiOperation({ summary: 'Record a public shop profile or listing click' })
  recordClick(@Body() input: CreateClickDto) {
    return this.admin.recordClick(input);
  }
}
