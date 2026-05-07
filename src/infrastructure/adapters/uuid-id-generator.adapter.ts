import { LinkId } from '../../domain/value-objects/link-id.js';
import { AdminId } from '../../domain/value-objects/admin-id.js';
import type { IdGenerator } from '../../application/ports/out/id-generator.port.js';

export class UuidIdGenerator implements IdGenerator {
  newLinkId(): LinkId {
    return LinkId.generate();
  }

  newAdminId(): AdminId {
    return AdminId.generate();
  }
}
