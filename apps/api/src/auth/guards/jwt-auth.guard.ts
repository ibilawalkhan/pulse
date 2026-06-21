import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/** Protects routes by requiring a valid Bearer access token. */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
