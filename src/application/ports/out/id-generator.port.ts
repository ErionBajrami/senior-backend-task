import type { LinkId } from '../../../domain/value-objects/link-id.js';
import type { AdminId } from '../../../domain/value-objects/admin-id.js';

export interface IdGenerator {
  newLinkId(): LinkId;
  newAdminId(): AdminId;
}
