import { zodToJsonSchema } from 'zod-to-json-schema';
import { z } from 'zod';
import {
  CreateBucketSchema,
  ListFilesSchema,
  UploadFileSchema
} from '../schemas.js';
import { Context } from '@osaas/client-core';
import { CallToolRequest } from '@modelcontextprotocol/sdk/types.js';
import {
  createMinioBucket,
  getMinioInstance,
  listFilesInMinioBucket,
  uploadFileToMinioBucket
} from '../resources/minio_minio.js';

export function listOscTools() {
  return [
    {
      name: 'osc_upload_file',
      description:
        'Upload a file to Eyevinn Open Source Cloud Storage (OSC) Minio instance',
      inputSchema: zodToJsonSchema(UploadFileSchema)
    },
    {
      name: 'osc_list_files',
      description:
        'List files in a bucket on Eyevinn Open Source Cloud Storage (OSC) Minio instance',
      inputSchema: zodToJsonSchema(ListFilesSchema)
    },
    {
      name: 'osc_create_bucket',
      description:
        'Create a new bucket on Eyevinn Open Source Cloud Storage (OSC) Minio instance',
      inputSchema: zodToJsonSchema(CreateBucketSchema)
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
      case 'osc_upload_file': {
        const args = UploadFileSchema.parse(request.params.arguments);
        const uploaded = await uploadFile(
          args.name,
          args.bucket,
          args.objectKey,
          args.file,
          context
        );
        return {
          content: [
            {
              type: 'text',
              text: `File '${args.file}' uploaded to bucket '${args.bucket}' with object key '${args.objectKey}' on Minio instance '${args.name}'.`
            }
          ]
        };
      }

      case 'osc_list_files': {
        const args = ListFilesSchema.parse(request.params.arguments);
        const files = await listFiles(args.name, args.bucket, context);
        return {
          content: [
            {
              type: 'text',
              text: `Files in bucket '${args.bucket}' on MinIO instance '${args.name}':`
            }
          ].concat(
            files.map((file) => ({
              type: 'text',
              text: file
            }))
          )
        };
      }

      case 'osc_create_bucket': {
        const args = CreateBucketSchema.parse(request.params.arguments);
        await createBucket(args.name, args.bucket, context);
        return {
          content: [
            {
              type: 'text',
              text: `Bucket '${args.bucket}' created on MinIO instance '${args.name}'.`
            }
          ]
        };
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

export async function uploadFile(
  name: string,
  bucket: string,
  objectKey: string,
  file: string,
  context: Context
) {
  const instance = await getMinioInstance(context, name);
  if (!instance) {
    throw new Error(`Minio instance with name ${name} not found`);
  }
  return await uploadFileToMinioBucket(
    instance.endpoint,
    instance.accessKeyId,
    instance.secretAccessKey,
    bucket,
    objectKey,
    file
  );
}

export async function listFiles(
  name: string,
  bucket: string,
  context: Context
) {
  const instance = await getMinioInstance(context, name);
  if (!instance) {
    throw new Error(`Minio instance with name ${name} not found`);
  }
  return await listFilesInMinioBucket(
    instance.endpoint,
    instance.accessKeyId,
    instance.secretAccessKey,
    bucket
  );
}

export async function createBucket(
  name: string,
  bucket: string,
  context: Context
) {
  const instance = await getMinioInstance(context, name);
  if (!instance) {
    throw new Error(`Minio instance with name ${name} not found`);
  }
  return await createMinioBucket(
    instance.endpoint,
    instance.accessKeyId,
    instance.secretAccessKey,
    bucket
  );
}
