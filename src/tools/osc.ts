import { zodToJsonSchema } from 'zod-to-json-schema';
import { z } from 'zod';
import {
  CreateBucketSchema,
  CreateDatabaseSchema,
  CreateVodPipelineSchema,
  RemoveVodPipelineSchema
} from '../schemas.js';
import { createValkeyInstance } from '../resources/valkey_io_valkey.js';
import { Context, removeInstance } from '@osaas/client-core';
import { CallToolRequest } from '@modelcontextprotocol/sdk/types.js';
import { createMinioInstance } from '../resources/minio_minio.js';
import { createEncoreInstance } from '../resources/encore.js';
import { createApacheCouchdbInstance } from '@osaas/client-services';
import { createEncoreCallbackListenerInstance } from '../resources/encore_callback_listener.js';
import { createEncorePackager } from '../resources/encore_packager.js';

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
      case 'osc_create_vod_pipeline': {
        const args = CreateVodPipelineSchema.parse(request.params.arguments);
        const pipeline = await createVodPipeline(
          args.name,
          args.output,
          context
        );
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

export async function createBucket(name: string, context: Context) {
  return await createMinioInstance(context, name);
}

export async function createVodPipeline(
  name: string,
  output: string,
  context: Context
) {
  const storage = await createMinioInstance(context, output);
  const transcoder = await createEncoreInstance(context, name);
  const redisUrl = await createValkeyInstance(context, name);
  const encoreCallback = await createEncoreCallbackListenerInstance(
    context,
    name,
    redisUrl,
    transcoder.url
  );
  const packager = await createEncorePackager(
    context,
    name,
    redisUrl,
    `s3://${name}/`,
    storage.accessKeyId,
    storage.secretAccessKey,
    storage.endpoint
  );
  return {
    jobs: transcoder.jobs,
    callbackUrl: encoreCallback.url,
    output: packager.OutputFolder
  };
}

export async function removeVodPipeline(name: string, context: Context) {
  await removeInstance(
    context,
    'encore',
    name,
    await context.getServiceAccessToken('encore')
  );
  await removeInstance(
    context,
    'eyevinn-encore-callback-listener',
    name,
    await context.getServiceAccessToken('eyevinn-encore-callback-listener')
  );
  await removeInstance(
    context,
    'eyevinn-encore-packager',
    name,
    await context.getServiceAccessToken('eyevinn-encore-packager')
  );
}
