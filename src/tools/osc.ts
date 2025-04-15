import { zodToJsonSchema } from 'zod-to-json-schema';
import { z } from 'zod';
import { UploadFileSchema } from '../schemas.js';
import { Context } from '@osaas/client-core';
import { CallToolRequest } from '@modelcontextprotocol/sdk/types.js';
import {
  getMinioInstance,
  uploadFileToMinioBucket
} from '../resources/minio_minio.js';

export function listOscTools() {
  return [
    {
      name: 'osc_upload_file',
      description:
        'Upload a file to Eyevinn Open Source Cloud. This is a placeholder and not implemented yet.',
      inputSchema: zodToJsonSchema(UploadFileSchema)
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
          toolResult: `File ${args.file} uploaded to s3://${args.bucket}/${args.objectKey} on Minio instance '${args.name}' (${uploaded.etag})`
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
