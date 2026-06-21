import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

/** Encapsulates password hashing so the algorithm and cost factor live in one place. */
@Injectable()
export class PasswordService {
  private readonly rounds = 12;

  /**
   * A throwaway hash used to equalise the cost of a login attempt when the user
   * does not exist, so response timing can't be used to enumerate accounts.
   */
  private readonly dummyHash = bcrypt.hashSync('pulse-non-existent-user', this.rounds);

  hash(plain: string): Promise<string> {
    return bcrypt.hash(plain, this.rounds);
  }

  /**
   * Verify a plaintext password against a stored hash. When `hash` is null
   * (user not found) we still run a comparison against a dummy hash to keep the
   * timing constant, then return false.
   */
  async verify(plain: string, hash: string | null): Promise<boolean> {
    const target = hash ?? this.dummyHash;
    const matches = await bcrypt.compare(plain, target);
    return hash !== null && matches;
  }
}
