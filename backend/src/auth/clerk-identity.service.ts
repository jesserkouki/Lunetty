import { createClerkClient, verifyToken } from '@clerk/backend';
import {
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import {
  isClerkAPIResponseError,
  TokenVerificationErrorReason,
} from '@clerk/backend/errors';

function isTokenVerificationError(
  error: unknown,
): error is { reason: TokenVerificationErrorReason } {
  if (
    typeof error !== 'object' ||
    error === null ||
    !('reason' in error) ||
    typeof error.reason !== 'string'
  ) {
    return false;
  }
  return Object.values(TokenVerificationErrorReason).some(
    (reason) => reason === error.reason,
  );
}

export interface ClerkProfile {
  clerkUserId: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  imageUrl: string | null;
}

@Injectable()
export class ClerkIdentityService {
  private clerkClient: ReturnType<typeof createClerkClient> | null = null;

  isConfigured(): boolean {
    return Boolean(
      process.env.CLERK_SECRET_KEY &&
        process.env.CLERK_AUTHORIZED_PARTIES?.split(',').some((party) =>
          party.trim(),
        ),
    );
  }

  async verifySessionToken(token: string): Promise<string> {
    const secretKey = process.env.CLERK_SECRET_KEY;
    const authorizedParties = process.env.CLERK_AUTHORIZED_PARTIES?.split(',')
      .map((party) => party.trim())
      .filter(Boolean);

    if (!secretKey || !authorizedParties?.length) {
      throw new InternalServerErrorException(
        'CLERK_SECRET_KEY and CLERK_AUTHORIZED_PARTIES must be configured',
      );
    }

    let result: Awaited<ReturnType<typeof verifyToken>>;
    try {
      result = await verifyToken(token, { secretKey, authorizedParties });
    } catch (error) {
      if (!isTokenVerificationError(error)) {
        throw error;
      }
      if (error.reason === TokenVerificationErrorReason.InvalidSecretKey) {
        throw new InternalServerErrorException('CLERK_SECRET_KEY is invalid');
      }
      if (
        error.reason ===
          TokenVerificationErrorReason.RemoteJWKFailedToLoad ||
        error.reason === TokenVerificationErrorReason.RemoteJWKMissing ||
        error.reason === TokenVerificationErrorReason.JWKFailedToResolve
      ) {
        throw new ServiceUnavailableException(
          'Unable to verify the Clerk session right now',
        );
      }
      throw new UnauthorizedException('Invalid or expired Clerk session token');
    }
    const errors =
      'errors' in result && Array.isArray(result.errors)
        ? result.errors
        : [];
    if (errors.length) {
      if (
        errors.some(
          (error: unknown) =>
            typeof error === 'object' &&
            error !== null &&
            'reason' in error &&
            error.reason === TokenVerificationErrorReason.InvalidSecretKey,
        )
      ) {
        throw new InternalServerErrorException(
          'CLERK_SECRET_KEY is invalid',
        );
      }
      const unavailable = errors.some((error: unknown) => {
        if (typeof error !== 'object' || error === null || !('reason' in error)) {
          return false;
        }
        return (
          error.reason === TokenVerificationErrorReason.RemoteJWKFailedToLoad ||
          error.reason === TokenVerificationErrorReason.RemoteJWKMissing ||
          error.reason === TokenVerificationErrorReason.JWKFailedToResolve
        );
      });
      if (unavailable) {
        throw new ServiceUnavailableException(
          'Unable to verify the Clerk session right now',
        );
      }
      throw new UnauthorizedException('Invalid or expired Clerk session token');
    }
    if (!result.sub) {
      throw new UnauthorizedException('Clerk session has no user identity');
    }
    return result.sub;
  }

  async getVerifiedProfile(clerkUserId: string): Promise<ClerkProfile> {
    try {
      const user = await this.getClient().users.getUser(clerkUserId);
      if (user.banned || user.locked) {
        throw new ForbiddenException('This Clerk account is unavailable');
      }

      const email = user.emailAddresses.find(
        (address) => address.id === user.primaryEmailAddressId,
      );
      if (!email || email.verification?.status !== 'verified') {
        throw new ForbiddenException(
          'A verified primary email address is required',
        );
      }

      return {
        clerkUserId: user.id,
        email: email.emailAddress,
        firstName: user.firstName,
        lastName: user.lastName,
        imageUrl: user.hasImage ? user.imageUrl : null,
      };
    } catch (error) {
      if (isClerkAPIResponseError(error) && error.status === 404) {
        throw new UnauthorizedException('Clerk user no longer exists');
      }
      throw error;
    }
  }

  private getClient(): ReturnType<typeof createClerkClient> {
    const secretKey = process.env.CLERK_SECRET_KEY;
    if (!secretKey) {
      throw new InternalServerErrorException(
        'CLERK_SECRET_KEY must be configured',
      );
    }
    this.clerkClient ??= createClerkClient({ secretKey });
    return this.clerkClient;
  }
}
