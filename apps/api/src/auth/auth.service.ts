import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import type { LoginDto, RegisterDto } from '@pulse/shared';
import type { User } from '@pulse/db';
import { AuthRepository } from './auth.repository';
import type { AuthResult, RefreshTokenPayload } from './interfaces/jwt-payload.interface';
import { PasswordService } from './services/password.service';
import { TokenService } from './services/token.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly repository: AuthRepository,
    private readonly passwords: PasswordService,
    private readonly tokens: TokenService,
    @InjectPinoLogger(AuthService.name) private readonly logger: PinoLogger,
  ) {}

  /** Create a new account and issue tokens. Fails if the email is taken. */
  async register(dto: RegisterDto): Promise<AuthResult> {
    const existing = await this.repository.findByEmail(dto.email);
    if (existing) {
      throw new ConflictException('Email is already registered');
    }

    const passwordHash = await this.passwords.hash(dto.password);
    const user = await this.repository.create(dto.email, passwordHash);

    this.logger.info({ userId: user.id }, 'user registered');
    return this.issueTokens(user);
  }

  /** Verify credentials and issue tokens. Uses a generic error to avoid leaking
   * whether the email exists. */
  async login(dto: LoginDto): Promise<AuthResult> {
    const user = await this.repository.findByEmail(dto.email);
    const passwordValid = await this.passwords.verify(dto.password, user?.passwordHash ?? null);

    if (!user || !passwordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    this.logger.info({ userId: user.id }, 'user logged in');
    return this.issueTokens(user);
  }

  /** Exchange a valid refresh token for a fresh access token. */
  async refresh(refreshToken: string | undefined): Promise<{ accessToken: string }> {
    if (!refreshToken) {
      throw new UnauthorizedException('Missing refresh token');
    }

    let payload: RefreshTokenPayload;
    try {
      payload = await this.tokens.verifyRefreshToken(refreshToken);
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    const user = await this.repository.findById(payload.sub);
    if (!user) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    const accessToken = await this.tokens.signAccessToken({ sub: user.id, email: user.email });
    return { accessToken };
  }

  private async issueTokens(user: User): Promise<AuthResult> {
    const [accessToken, refreshToken] = await Promise.all([
      this.tokens.signAccessToken({ sub: user.id, email: user.email }),
      this.tokens.signRefreshToken({ sub: user.id }),
    ]);

    return {
      user: { id: user.id, email: user.email },
      accessToken,
      refreshToken,
    };
  }
}
