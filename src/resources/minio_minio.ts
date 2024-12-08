import { Context, createInstance, getInstance } from '@osaas/client-core';
import { delay, waitForInstanceReady } from './util.js';
import * as Minio from 'minio';
import { MinioMinio, MinioMinioConfig } from '@osaas/client-services';
import { randomBytes } from 'crypto';

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
