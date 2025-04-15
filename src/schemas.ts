import { z } from 'zod';

export const UploadFileSchema = z.object({
  name: z
    .string()
    .regex(/^[a-z0-9]+$/)
    .describe('Name of the minio instance'),
  bucket: z.string().describe('Name of the bucket'),
  objectKey: z.string().describe('Object key for the uploaded file'),
  file: z.string().describe('File to upload')
});

export type UploadFileSchema = z.infer<typeof UploadFileSchema>;
