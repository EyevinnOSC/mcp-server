import { zodToJsonSchema } from 'zod-to-json-schema';
import { z } from 'zod';
import {
  CreateBucketSchema,
  CreateDatabaseSchema,
  CreateVodPackage,
  CreateVodPipelineSchema,
  RemoveVodPipelineSchema,
  StorageBucket
} from '../schemas.js';
import { createValkeyInstance } from '../resources/valkey_io_valkey.js';
import { Context } from '@osaas/client-core';
import { CallToolRequest } from '@modelcontextprotocol/sdk/types.js';
import {
  createMinioInstance,
  getMinioInstance
} from '../resources/minio_minio.js';
import { getEncoreInstance } from '../resources/encore.js';
import { createApacheCouchdbInstance } from '@osaas/client-services';
import { getEncoreCallbackListenerInstance } from '../resources/encore_callback_listener.js';
import { getEncorePackager } from '../resources/encore_packager.js';
import {
  createVod,
  createVodPipeline,
  removeVodPipeline
} from '@osaas/client-transcode';

export function listOscTools() {
  return [
    {
      name: 'osc_create_db',
      description:
        'Create a new database instance in Eyevinn Open Source Cloud',
      inputSchema: zodToJsonSchema(CreateDatabaseSchema)
    },
    {
      name: 'osc_create_bucket',
      description:
        'Create an S3 compatible bucket in Eyevinn Open Source Cloud',
      inputSchema: zodToJsonSchema(CreateBucketSchema)
    },
    {
      name: 'osc_create_vod',
      description:
        'Create a VOD package using a VOD pipeline in Eyevinn Open Source Cloud',
      inputSchema: zodToJsonSchema(CreateVodPackage)
    },
    {
      name: 'osc_create_vod_pipeline',
      description: 'Create a VOD pipeline in Eyevinn Open Source Cloud',
      inputSchema: zodToJsonSchema(CreateVodPipelineSchema)
    },
    {
      name: 'osc_remove_vod_pipeline',
      description: 'Remove a VOD pipeline in Eyevinn Open Source Cloud',
      inputSchema: zodToJsonSchema(RemoveVodPipelineSchema)
    }
  ];
}

export async function handleOscToolRequest(
  request: CallToolRequest,
  context: Context
) {
  try {
    if (!request.params.arguments) {
      throw new Error('Arguments are required');
    }

    switch (request.params.name) {
      case 'osc_create_db': {
        const args = CreateDatabaseSchema.parse(request.params.arguments);
        const connectionUrl = await createDatabase(
          args.name,
          args.type,
          context
        );
        return { toolResult: connectionUrl };
      }
      case 'osc_create_bucket': {
        const args = CreateBucketSchema.parse(request.params.arguments);
        const { endpoint, accessKeyId, secretAccessKey } = await createBucket(
          args.name,
          context
        );
        return { toolResult: { endpoint, accessKeyId, secretAccessKey } };
      }
      case 'osc_create_vod': {
        const args = CreateVodPackage.parse(request.params.arguments);
        const pipeline = await getVodPipeline(args.pipeline, context);
        if (!pipeline) {
          throw new Error(`Pipeline not found: ${args.pipeline}`);
        }
        const vodPackage = await createVod(pipeline, args.source, context);
        return { toolResult: vodPackage };
      }
      case 'osc_create_vod_pipeline': {
        const args = CreateVodPipelineSchema.parse(request.params.arguments);
        const pipeline = await createVodPipeline(args.name, context);
        return { toolResult: pipeline };
      }
      case 'osc_remove_vod_pipeline': {
        const args = RemoveVodPipelineSchema.parse(request.params.arguments);
        await removeVodPipeline(args.name, context);
        return { toolResult: 'removed' };
      }

      default:
        throw new Error(`Unknown tool: ${request.params.name}`);
    }
  } catch (error) {
    console.error(error);
    if (error instanceof z.ZodError) {
      throw new Error(
        `Invalid arguments: ${error.errors
          .map((e) => `${e.path.join('.')}: ${e.message}`)
          .join(', ')}`
      );
    }
    throw error;
  }
}

export async function createDatabase(
  name: string,
  type: string,
  context: Context
) {
  switch (type) {
    case 'MemoryDb': {
      const connectionUrl = await createValkeyInstance(context, name);
      return connectionUrl;
    }
    case 'NoSQL': {
      const instance = await createApacheCouchdbInstance(context, {
        name,
        AdminPassword: 'admin'
      });
      return instance.url;
    }
    default:
      throw new Error(`Unknown database type: ${type}`);
  }
}

export async function createBucket(
  name: string,
  context: Context
): Promise<StorageBucket> {
  return await createMinioInstance(context, name);
}

export async function createRedisInstance(name: string, context: Context) {
  return await createValkeyInstance(context, name);
}

export async function getVodPipeline(name: string, context: Context) {
  const transcoder = await getEncoreInstance(context, name);
  const encoreCallback = await getEncoreCallbackListenerInstance(context, name);
  const storage = await getMinioInstance(context, name);
  const packager = await getEncorePackager(context, name);

  return {
    name,
    jobs: transcoder.jobs,
    callbackUrl: encoreCallback.url,
    output: packager.OutputFolder,
    endpoint: storage.endpoint
  };
}
