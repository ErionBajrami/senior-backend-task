import { z } from 'zod';


export const LoginBody = z.object({
  username: z.string().min(1).max(100),
  password: z.string().min(1).max(200),
});
export type LoginBodyDto = z.infer<typeof LoginBody>;

export const LoginResponse = z.object({
  token: z.string(),
  expiresAt: z.string().datetime(),
});
export type LoginResponseDto = z.infer<typeof LoginResponse>;
