import { Link } from '../../../domain/entities/link.js';
import { LinkId } from '../../../domain/value-objects/link-id.js';
import { LinkTitle } from '../../../domain/value-objects/link-title.js';
import { Url } from '../../../domain/value-objects/url.js';
import { LinkDescription } from '../../../domain/value-objects/link-description.js';
import { LinkCategory } from '../../../domain/value-objects/link-category.js';

export interface LinkDoc {
  _id: string;
  title: string;
  url: string;
  description: string | null;
  iconUrl: string | null;
  category: string | null;
  displayOrder: number;
  isActive: boolean;
  clickCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export function linkToDoc(link: Link): LinkDoc {
  return {
    _id: link.id.value,
    title: link.title.value,
    url: link.url.value,
    description: link.description === null ? null : link.description.value,
    iconUrl: link.iconUrl === null ? null : link.iconUrl.value,
    category: link.category === null ? null : link.category.value,
    displayOrder: link.displayOrder,
    isActive: link.isActive,
    clickCount: link.clickCount,
    createdAt: link.createdAt,
    updatedAt: link.updatedAt,
  };
}

export function docToLink(doc: LinkDoc): Link {
  return Link.restore({
    id: LinkId.fromString(doc._id),
    title: LinkTitle.create(doc.title),
    url: Url.create(doc.url),
    description: doc.description === null ? null : LinkDescription.create(doc.description),
    iconUrl: doc.iconUrl === null ? null : Url.create(doc.iconUrl),
    category: doc.category === null ? null : LinkCategory.create(doc.category),
    displayOrder: doc.displayOrder,
    isActive: doc.isActive,
    clickCount: doc.clickCount,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  });
}
