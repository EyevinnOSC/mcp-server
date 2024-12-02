import { z } from 'zod';

export const CreateDatabaseSchema = z.object({
  name: z.string().describe('Name of the database'),
  type: z.string().describe('Type of database [SQL, NoSQL, MemoryDb]')
});

export type CreateDatabaseSchema = z.infer<typeof CreateDatabaseSchema>;

export const CreateBucketSchema = z.object({
  name: z.string().describe('Name of the bucket')
});
export type CreateBucketSchema = z.infer<typeof CreateBucketSchema>;
