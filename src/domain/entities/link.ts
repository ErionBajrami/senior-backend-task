import type { LinkId } from '../value-objects/link-id.js';
import type { LinkTitle } from '../value-objects/link-title.js';
import type { Url } from '../value-objects/url.js';
import type { LinkDescription } from '../value-objects/link-description.js';
import type { LinkCategory } from '../value-objects/link-category.js';

export interface LinkProps {
  id: LinkId;
  title: LinkTitle;
  url: Url;
  description: LinkDescription | null;
  iconUrl: Url | null;
  category: LinkCategory | null;
  displayOrder: number;
  isActive: boolean;
  clickCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface LinkCreationInput {
  id: LinkId;
  title: LinkTitle;
  url: Url;
  description: LinkDescription | null;
  iconUrl?: Url | null | undefined;
  category?: LinkCategory | null | undefined;
  displayOrder?: number | undefined;
  now: Date;
}

const MAX_DISPLAY_ORDER = 1_000_000;

function assertValidDisplayOrder(n: number): void {
  if (!Number.isInteger(n) || n < 0 || n > MAX_DISPLAY_ORDER) {
    throw new Error(`Invalid displayOrder: ${n.toString()}`);
  }
}

export class Link {
  private constructor(private readonly props: LinkProps) {}

  static create(input: LinkCreationInput): Link {
    const displayOrder = input.displayOrder ?? 0;
    assertValidDisplayOrder(displayOrder);
    return new Link({
      id: input.id,
      title: input.title,
      url: input.url,
      description: input.description,
      iconUrl: input.iconUrl ?? null,
      category: input.category ?? null,
      displayOrder,
      isActive: true,
      clickCount: 0,
      createdAt: input.now,
      updatedAt: input.now,
    });
  }

  static restore(props: LinkProps): Link {
    return new Link({ ...props });
  }

  get id(): LinkId {
    return this.props.id;
  }

  get title(): LinkTitle {
    return this.props.title;
  }

  get url(): Url {
    return this.props.url;
  }

  get description(): LinkDescription | null {
    return this.props.description;
  }

  get iconUrl(): Url | null {
    return this.props.iconUrl;
  }

  get category(): LinkCategory | null {
    return this.props.category;
  }

  get displayOrder(): number {
    return this.props.displayOrder;
  }

  get isActive(): boolean {
    return this.props.isActive;
  }

  get clickCount(): number {
    return this.props.clickCount;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  rename(title: LinkTitle, now: Date): void {
    this.props.title = title;
    this.props.updatedAt = now;
  }

  changeUrl(url: Url, now: Date): void {
    this.props.url = url;
    this.props.updatedAt = now;
  }

  editDescription(description: LinkDescription | null, now: Date): void {
    this.props.description = description;
    this.props.updatedAt = now;
  }

  changeIcon(iconUrl: Url | null, now: Date): void {
    this.props.iconUrl = iconUrl;
    this.props.updatedAt = now;
  }

  recategorize(category: LinkCategory | null, now: Date): void {
    this.props.category = category;
    this.props.updatedAt = now;
  }

  reorder(displayOrder: number, now: Date): void {
    assertValidDisplayOrder(displayOrder);
    this.props.displayOrder = displayOrder;
    this.props.updatedAt = now;
  }

  deactivate(now: Date): void {
    if (!this.props.isActive) {
      return;
    }
    this.props.isActive = false;
    this.props.updatedAt = now;
  }

  activate(now: Date): void {
    if (this.props.isActive) {
      return;
    }
    this.props.isActive = true;
    this.props.updatedAt = now;
  }
}
