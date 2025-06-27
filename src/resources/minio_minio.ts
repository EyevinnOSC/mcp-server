import { Context, createInstance, getInstance } from '@osaas/client-core';
import { delay, waitForInstanceReady } from './util.js';
import * as Minio from 'minio';
import { MinioMinio, MinioMinioConfig } from '@osaas/client-services';
import { randomBytes } from 'crypto';
import mime from 'mime-types';

const SERVICE_ID = 'minio-minio';

export interface MinioBucket {
  name: string;
  endpoint: string;
  accessKeyId: string;
  secretAccessKey: string;
}

export async function createMinioInstance(
  ctx: Context,
  name: string
): Promise<MinioBucket> {
  const serviceAccessToken = await ctx.getServiceAccessToken(SERVICE_ID);
  let instance: MinioMinio = await getInstance(
    ctx,
    SERVICE_ID,
    name,
    serviceAccessToken
  );
  if (!instance) {
    const rootPassword = randomBytes(16).toString('hex');

    const config: MinioMinioConfig = {
      name,
      RootUser: 'root',
      RootPassword: rootPassword
    };
    const newInstance = await createInstance(
      ctx,
      SERVICE_ID,
      serviceAccessToken,
      config
    );
    if (!newInstance) {
      throw new Error(`Failed to create instance with name ${name}`);
    }

    instance = newInstance;
    await waitForInstanceReady(SERVICE_ID, name, ctx);
    await delay(2000);

    const minioClient = new Minio.Client({
      endPoint: new URL(instance.url).hostname,
      accessKey: 'root',
      secretKey: instance.RootPassword || ''
    });
    await minioClient.makeBucket(name);
  }

  return {
    name: instance.name,
    endpoint: instance.url,
    accessKeyId: 'root',
    secretAccessKey: instance.RootPassword || ''
  };
}

export async function getMinioInstance(ctx: Context, name: string) {
  const serviceAccessToken = await ctx.getServiceAccessToken(SERVICE_ID);
  const instance: MinioMinio = await getInstance(
    ctx,
    SERVICE_ID,
    name,
    serviceAccessToken
  );
  if (!instance) {
    throw new Error(`Minio Instance ${name} not found`);
  }
  return {
    name: instance.name,
    endpoint: instance.url,
    accessKeyId: instance.RootUser || '',
    secretAccessKey: instance.RootPassword || ''
  };
}

export async function uploadFileToMinioBucket(
  endpoint: string,
  accessKeyId: string,
  secretAccessKey: string,
  bucket: string,
  objectKey: string,
  filePath: string
) {
  const minioClient = new Minio.Client({
    endPoint: new URL(endpoint).hostname,
    accessKey: accessKeyId,
    secretKey: secretAccessKey
  });

  // Get mime type based on file extension
  const contentType = mime.lookup(filePath) || 'application/octet-stream';

  const metaData = {
    'Content-Type': contentType
  };

  const uploadedObject = await minioClient.fPutObject(
    bucket,
    objectKey,
    filePath,
    metaData
  );
  return uploadedObject;
}

export async function listFilesInMinioBucket(
  endpoint: string,
  accessKeyId: string,
  secretAccessKey: string,
  bucket: string
): Promise<string[]> {
  const minioClient = new Minio.Client({
    endPoint: new URL(endpoint).hostname,
    accessKey: accessKeyId,
    secretKey: secretAccessKey
  });

  const objects = await minioClient.listObjects(bucket, '', true);
  const fileList: string[] = [];
  for await (const obj of objects) {
    fileList.push(obj.name);
  }
  return fileList;
}

export async function createMinioBucket(
  endpoint: string,
  accessKeyId: string,
  secretAccessKey: string,
  bucket: string
): Promise<void> {
  const minioClient = new Minio.Client({
    endPoint: new URL(endpoint).hostname,
    accessKey: accessKeyId,
    secretKey: secretAccessKey
  });

  const bucketExists = await minioClient.bucketExists(bucket);
  if (!bucketExists) {
    await minioClient.makeBucket(bucket);
  } else {
    throw new Error(`Bucket ${bucket} already exists`);
  }
}

export async function listMinioBuckets(
  endpoint: string,
  accessKeyId: string,
  secretAccessKey: string
): Promise<string[]> {
  const minioClient = new Minio.Client({
    endPoint: new URL(endpoint).hostname,
    accessKey: accessKeyId,
    secretKey: secretAccessKey
  });

  const buckets = await minioClient.listBuckets();
  return buckets.map((bucket) => bucket.name);
}
