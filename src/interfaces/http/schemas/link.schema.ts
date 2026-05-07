import { z } from 'zod';

export const LinkIdParam = z.object({
  id: z.string().uuid('Invalid link id'),
});
export type LinkIdParamDto = z.infer<typeof LinkIdParam>;

const HTTP_URL = /^https?:\/\//i;

const titleField = z.string().min(1).max(200);
const urlField = z
  .string()
  .url()
  .max(2048)
  .refine((u) => HTTP_URL.test(u), 'URL must use http or https');
const descriptionField = z.string().max(2000).nullable().optional();
const iconUrlField = z
  .string()
  .url()
  .max(2048)
  .refine((u) => HTTP_URL.test(u), 'URL must use http or https')
  .nullable()
  .optional();
const categoryField = z.string().min(1).max(50).nullable().optional();
const displayOrderField = z.number().int().min(0).max(1_000_000).optional();

export const CreateLinkBody = z.object({
  title: titleField,
  url: urlField,
  description: descriptionField,
  iconUrl: iconUrlField,
  category: categoryField,
  displayOrder: displayOrderField,
});
export type CreateLinkBodyDto = z.infer<typeof CreateLinkBody>;

export const UpdateLinkBody = z.object({
  title: titleField.optional(),
  url: urlField.optional(),
  description: descriptionField,
  iconUrl: iconUrlField,
  category: categoryField,
  displayOrder: displayOrderField,
  isActive: z.boolean().optional(),
});
export type UpdateLinkBodyDto = z.infer<typeof UpdateLinkBody>;

export const LinkResponse = z.object({
  id: z.string().uuid(),
  title: z.string(),
  url: z.string(),
  description: z.string().nullable(),
  iconUrl: z.string().nullable(),
  category: z.string().nullable(),
  displayOrder: z.number().int().nonnegative(),
  isActive: z.boolean(),
  clickCount: z.number().int().nonnegative(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type LinkResponseDto = z.infer<typeof LinkResponse>;

export const LinkListResponse = z.array(LinkResponse);
export type LinkListResponseDto = z.infer<typeof LinkListResponse>;

export const LinkListQuery = z.object({
  limit: z.coerce.number().int().min(1).max(200).optional(),
  offset: z.coerce.number().int().min(0).optional(),
});
export type LinkListQueryDto = z.infer<typeof LinkListQuery>;
