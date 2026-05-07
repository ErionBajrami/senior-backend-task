import type { Logger } from 'pino';
import { Admin } from '../domain/entities/admin.js';
import { Username } from '../domain/value-objects/username.js';
import type { AdminRepository } from '../domain/repositories/admin.repository.js';
import type { Clock } from '../application/ports/out/clock.port.js';
import type { IdGenerator } from '../application/ports/out/id-generator.port.js';
import type { PasswordHasher } from '../application/ports/out/password-hasher.port.js';

export interface SeedAdminConfig {
  adminRepo: AdminRepository;
  passwordHasher: PasswordHasher;
  idGenerator: IdGenerator;
  clock: Clock;
  username: string;
  password: string;
  logger: Logger;
}

export async function seedAdmin(config: SeedAdminConfig): Promise<void> {
  const username = Username.create(config.username);
  const existing = await config.adminRepo.findByUsername(username);
  if (existing) {
    config.logger.info({ username: username.value }, 'admin already exists, skipping seed');
    return;
  }

  const passwordHash = await config.passwordHasher.hash(config.password);
  const admin = Admin.create({
    id: config.idGenerator.newAdminId(),
    username,
    passwordHash,
    now: config.clock.now(),
  });
  await config.adminRepo.save(admin);
  config.logger.info({ username: username.value }, 'admin seeded');
}
