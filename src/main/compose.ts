import { randomBytes } from 'node:crypto';
import type { Db } from 'mongodb';
import type { preHandlerHookHandler } from 'fastify';
import type { Logger } from 'pino';

import type { Env } from '../infrastructure/config/env.js';

import { SystemClock } from '../infrastructure/adapters/system-clock.adapter.js';
import { UuidIdGenerator } from '../infrastructure/adapters/uuid-id-generator.adapter.js';
import { Argon2PasswordHasher } from '../infrastructure/adapters/argon2-password-hasher.adapter.js';
import { JwtTokenSigner } from '../infrastructure/adapters/jwt-token-signer.adapter.js';
import { JwtTokenVerifier } from '../infrastructure/adapters/jwt-token-verifier.adapter.js';
import { MongoLinkRepository } from '../infrastructure/persistence/mongo/link.mongo-repository.js';
import { MongoAdminRepository } from '../infrastructure/persistence/mongo/admin.mongo-repository.js';

import type { AdminRepository } from '../domain/repositories/admin.repository.js';
import type { Clock } from '../application/ports/out/clock.port.js';
import type { IdGenerator } from '../application/ports/out/id-generator.port.js';
import type { PasswordHasher } from '../application/ports/out/password-hasher.port.js';

import { AuthenticateAdmin } from '../application/use-cases/authenticate-admin.use-case.js';
import { CreateLink } from '../application/use-cases/create-link.use-case.js';
import { DeleteLink } from '../application/use-cases/delete-link.use-case.js';
import { GetActiveLink } from '../application/use-cases/get-active-link.use-case.js';
import { GetLink } from '../application/use-cases/get-link.use-case.js';
import { JumpToLink } from '../application/use-cases/jump-to-link.use-case.js';
import { ListActiveLinks } from '../application/use-cases/list-active-links.use-case.js';
import { ListAllLinks } from '../application/use-cases/list-all-links.use-case.js';
import { UpdateLink } from '../application/use-cases/update-link.use-case.js';
import { VerifyAdminToken } from '../application/use-cases/verify-admin-token.use-case.js';

import { makeAuthMiddleware } from '../interfaces/http/middleware/auth.middleware.js';

export interface ComposedApp {
  listActiveLinks: ListActiveLinks;
  getActiveLink: GetActiveLink;
  jumpToLink: JumpToLink;
  listAllLinks: ListAllLinks;
  getLink: GetLink;
  createLink: CreateLink;
  updateLink: UpdateLink;
  deleteLink: DeleteLink;
  authenticateAdmin: AuthenticateAdmin;
  authMiddleware: preHandlerHookHandler;

  adminRepo: AdminRepository;
  passwordHasher: PasswordHasher;
  idGenerator: IdGenerator;
  clock: Clock;
}

export interface ComposeDeps {
  db: Db;
  env: Env;
  logger: Logger;
}

export async function composeApp(deps: ComposeDeps): Promise<ComposedApp> {
  const { db, env, logger } = deps;

  const clock = new SystemClock();
  const idGenerator = new UuidIdGenerator();
  const passwordHasher = new Argon2PasswordHasher();
  // Pre-compute a dummy hash with the LIVE Argon2 params so a failed-login on a
  // non-existent user spends the same time as a real verify. Hardcoding a hash
  // string would diverge from the hasher's params and re-introduce the timing
  // oracle this is meant to close.
  const dummyPasswordHash = await passwordHasher.hash(randomBytes(32).toString('hex'));
  const tokenSigner = new JwtTokenSigner(
    {
      secret: env.JWT_SECRET,
      ttlSeconds: env.JWT_TTL_SECONDS,
      issuer: env.JWT_ISSUER,
      audience: env.JWT_AUDIENCE,
    },
    clock,
  );
  const tokenVerifier = new JwtTokenVerifier({
    secret: env.JWT_SECRET,
    issuer: env.JWT_ISSUER,
    audience: env.JWT_AUDIENCE,
    logger,
  });

  const linkRepo = new MongoLinkRepository(db);
  const adminRepo = new MongoAdminRepository(db);

  const listActiveLinks = new ListActiveLinks(linkRepo);
  const getActiveLink = new GetActiveLink(linkRepo);
  const jumpToLink = new JumpToLink(linkRepo);
  const listAllLinks = new ListAllLinks(linkRepo);
  const getLink = new GetLink(linkRepo);
  const createLink = new CreateLink(linkRepo, idGenerator, clock);
  const updateLink = new UpdateLink(linkRepo, clock);
  const deleteLink = new DeleteLink(linkRepo, clock);
  const authenticateAdmin = new AuthenticateAdmin(adminRepo, passwordHasher, tokenSigner, dummyPasswordHash);
  const verifyAdminToken = new VerifyAdminToken(adminRepo, tokenVerifier);

  const authMiddleware = makeAuthMiddleware({ verifyAdminToken });

  return {
    listActiveLinks,
    getActiveLink,
    jumpToLink,
    listAllLinks,
    getLink,
    createLink,
    updateLink,
    deleteLink,
    authenticateAdmin,
    authMiddleware,
    adminRepo,
    passwordHasher,
    idGenerator,
    clock,
  };
}
