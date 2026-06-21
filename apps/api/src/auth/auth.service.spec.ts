import { ConflictException, UnauthorizedException } from '@nestjs/common';
import type { PinoLogger } from 'nestjs-pino';
import type { LoginDto, RegisterDto } from '@pulse/shared';
import type { User } from '@pulse/db';
import { AuthRepository } from './auth.repository';
import { AuthService } from './auth.service';
import { PasswordService } from './services/password.service';
import { TokenService } from './services/token.service';

const user: User = {
  id: 'user-1',
  email: 'dev@pulse.io',
  passwordHash: 'hashed',
  createdAt: new Date('2026-01-01T00:00:00Z'),
};

describe('AuthService', () => {
  let service: AuthService;
  let repository: jest.Mocked<Pick<AuthRepository, 'findByEmail' | 'findById' | 'create'>>;
  let passwords: jest.Mocked<Pick<PasswordService, 'hash' | 'verify'>>;
  let tokens: jest.Mocked<
    Pick<TokenService, 'signAccessToken' | 'signRefreshToken' | 'verifyRefreshToken'>
  >;

  beforeEach(() => {
    repository = {
      findByEmail: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
    };
    passwords = {
      hash: jest.fn(),
      verify: jest.fn(),
    };
    tokens = {
      signAccessToken: jest.fn().mockResolvedValue('access-token'),
      signRefreshToken: jest.fn().mockResolvedValue('refresh-token'),
      verifyRefreshToken: jest.fn(),
    };
    const logger = { info: jest.fn() } as unknown as PinoLogger;

    service = new AuthService(
      repository as unknown as AuthRepository,
      passwords as unknown as PasswordService,
      tokens as unknown as TokenService,
      logger,
    );
  });

  describe('register', () => {
    const dto: RegisterDto = { email: 'dev@pulse.io', password: 'supersecret' };

    it('creates the user and returns tokens', async () => {
      repository.findByEmail.mockResolvedValue(null);
      passwords.hash.mockResolvedValue('hashed');
      repository.create.mockResolvedValue(user);

      const result = await service.register(dto);

      expect(passwords.hash).toHaveBeenCalledWith('supersecret');
      expect(repository.create).toHaveBeenCalledWith('dev@pulse.io', 'hashed');
      expect(result).toEqual({
        user: { id: 'user-1', email: 'dev@pulse.io' },
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      });
    });

    it('rejects a duplicate email', async () => {
      repository.findByEmail.mockResolvedValue(user);

      await expect(service.register(dto)).rejects.toBeInstanceOf(ConflictException);
      expect(repository.create).not.toHaveBeenCalled();
    });
  });

  describe('login', () => {
    const dto: LoginDto = { email: 'dev@pulse.io', password: 'supersecret' };

    it('returns tokens for valid credentials', async () => {
      repository.findByEmail.mockResolvedValue(user);
      passwords.verify.mockResolvedValue(true);

      const result = await service.login(dto);

      expect(passwords.verify).toHaveBeenCalledWith('supersecret', 'hashed');
      expect(result.accessToken).toBe('access-token');
      expect(result.refreshToken).toBe('refresh-token');
    });

    it('rejects an incorrect password', async () => {
      repository.findByEmail.mockResolvedValue(user);
      passwords.verify.mockResolvedValue(false);

      await expect(service.login(dto)).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('rejects an unknown user but still verifies for timing safety', async () => {
      repository.findByEmail.mockResolvedValue(null);
      passwords.verify.mockResolvedValue(false);

      await expect(service.login(dto)).rejects.toBeInstanceOf(UnauthorizedException);
      expect(passwords.verify).toHaveBeenCalledWith('supersecret', null);
    });
  });

  describe('refresh', () => {
    it('rejects a missing token', async () => {
      await expect(service.refresh(undefined)).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('rejects an invalid token', async () => {
      tokens.verifyRefreshToken.mockRejectedValue(new Error('bad signature'));

      await expect(service.refresh('bad-token')).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('rejects when the user no longer exists', async () => {
      tokens.verifyRefreshToken.mockResolvedValue({ sub: 'user-1' });
      repository.findById.mockResolvedValue(null);

      await expect(service.refresh('good-token')).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('issues a new access token for a valid refresh token', async () => {
      tokens.verifyRefreshToken.mockResolvedValue({ sub: 'user-1' });
      repository.findById.mockResolvedValue(user);

      const result = await service.refresh('good-token');

      expect(tokens.signAccessToken).toHaveBeenCalledWith({ sub: 'user-1', email: 'dev@pulse.io' });
      expect(result).toEqual({ accessToken: 'access-token' });
    });
  });
});
