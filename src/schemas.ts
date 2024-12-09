import { z } from 'zod';

export const CreateDatabaseSchema = z.object({
  name: z
    .string()
    .regex(/^[a-z0-9]+$/)
    .describe('Name of the database'),
  type: z.string().describe('Type of database [SQL, NoSQL, MemoryDb]')
});

export type CreateDatabaseSchema = z.infer<typeof CreateDatabaseSchema>;

export const CreateBucketSchema = z.object({
  name: z
    .string()
    .regex(/^[a-z0-9]+$/)
    .describe('Name of the bucket')
});
export type CreateBucketSchema = z.infer<typeof CreateBucketSchema>;

export const StorageBucket = z.object({
  name: z
    .string()
    .regex(/^[a-z0-9]+$/)
    .describe('Name of the bucket'),
  endpoint: z.string().describe('Endpoint of the bucket'),
  accessKeyId: z.string().describe('Access key ID'),
  secretAccessKey: z.string().describe('Secret access key')
});
export type StorageBucket = z.infer<typeof StorageBucket>;

export const CreateVodPackage = z.object({
  pipeline: z
    .string()
    .regex(/^[a-z0-9]+$/)
    .describe('Name of the pipeline'),
  source: z.string().describe('Source video URL')
});
export type CreateVodPackage = z.infer<typeof CreateVodPackage>;

export const CreateVodPipelineSchema = z.object({
  name: z
    .string()
    .regex(/^[a-z0-9]+$/)
    .describe('Name of the pipeline')
});
export type CreateVodPipelineSchema = z.infer<typeof CreateVodPipelineSchema>;

export const RemoveVodPipelineSchema = z.object({
  name: z.string().describe('Name of the pipeline')
});
export type RemoveVodPipelineSchema = z.infer<typeof CreateVodPipelineSchema>;
