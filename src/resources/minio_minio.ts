import {
  Context,
  createInstance,
  getInstance,
  getInstanceHealth
} from '@osaas/client-core';
import { delay } from './util.js';
import * as Minio from 'minio';

const SERVICE_ID = 'minio-minio';

export async function createMinioInstance(ctx: Context, name: string) {
  const serviceAccessToken = await ctx.getServiceAccessToken(SERVICE_ID);
  let instance = await getInstance(ctx, SERVICE_ID, name, serviceAccessToken);
  if (!instance) {
    const rootPassword = `ai${Math.random().toString(36).substring(7)}`;

    const newInstance = await createInstance(
      ctx,
      SERVICE_ID,
      serviceAccessToken,
      {
        name,
        RootUser: 'root',
        RootPassword: rootPassword
      }
    );
    if (!newInstance) {
      throw new Error(`Failed to create instance with name ${name}`);
    }

    instance = newInstance;
    let instanceOk = false;
    while (!instanceOk) {
      await delay(1000);
      const status = await getInstanceHealth(
        ctx,
        SERVICE_ID,
        name,
        serviceAccessToken
      );
      if (status && status === 'running') {
        instanceOk = true;
      }
    }
    await delay(2000);
  }

  const minioClient = new Minio.Client({
    endPoint: new URL(instance.url).hostname,
    accessKey: 'root',
    secretKey: instance.RootPassword
  });
  await minioClient.makeBucket(name);

  return {
    endpoint: instance.url,
    accessKeyId: 'root',
    secretAccessKey: instance.RootPassword
  };
}
