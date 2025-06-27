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

export const ListFilesSchema = z.object({
  name: z
    .string()
    .regex(/^[a-z0-9]+$/)
    .describe('Name of the minio instance'),
  bucket: z.string().describe('Name of the bucket')
});

export type ListFilesSchema = z.infer<typeof ListFilesSchema>;

export const CreateBucketSchema = z.object({
  name: z
    .string()
    .regex(/^[a-z0-9]+$/)
    .describe('Name of the minio instance'),
  bucket: z.string().describe('Name of the bucket to create')
});

export type CreateBucketSchema = z.infer<typeof CreateBucketSchema>;

export const ListBucketsSchema = z.object({
  name: z
    .string()
    .regex(/^[a-z0-9]+$/)
    .describe('Name of the minio instance')
});
export type ListBucketsSchema = z.infer<typeof ListBucketsSchema>;
