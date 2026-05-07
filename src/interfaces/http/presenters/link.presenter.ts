import type { Link } from '../../../domain/entities/link.js';
import type { LinkResponseDto } from '../schemas/link.schema.js';

export function presentLink(link: Link): LinkResponseDto {
  return {
    id: link.id.value,
    title: link.title.value,
    url: link.url.value,
    description: link.description === null ? null : link.description.value,
    iconUrl: link.iconUrl === null ? null : link.iconUrl.value,
    category: link.category === null ? null : link.category.value,
    displayOrder: link.displayOrder,
    isActive: link.isActive,
    clickCount: link.clickCount,
    createdAt: link.createdAt.toISOString(),
    updatedAt: link.updatedAt.toISOString(),
  };
}

export function presentLinks(links: readonly Link[]): readonly LinkResponseDto[] {
  return links.map(presentLink);
}
