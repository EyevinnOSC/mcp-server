import { Context, getInstance } from '@osaas/client-core';
import {
  EyevinnEncorePackager,
  createEyevinnEncorePackagerInstance
} from '@osaas/client-services';
import { waitForInstanceReady } from './util.js';

const SERVICE_ID = 'eyevinn-encore-packager';

export async function createEncorePackager(
  ctx: Context,
  name: string,
  redisUrl: string,
  outputFolder: string,
  accessKeyId: string,
  secretAccessKey: string,
  s3EndpointUrl: string
) {
  const serviceAccessToken = await ctx.getServiceAccessToken(SERVICE_ID);
  let instance: EyevinnEncorePackager = await getInstance(
    ctx,
    SERVICE_ID,
    name,
    serviceAccessToken
  );
  if (!instance) {
    const config = {
      name,
      RedisUrl: redisUrl,
      RedisQueue: 'package',
      OutputFolder: outputFolder,
      AwsAccessKeyId: accessKeyId,
      AwsSecretAccessKey: secretAccessKey,
      S3EndpointUrl: s3EndpointUrl,
      PersonalAccessToken: '{{secrets.osctoken}}'
    };
    const newInstance = await createEyevinnEncorePackagerInstance(ctx, config);
    if (!newInstance) {
      throw new Error(`Failed to create instance with name ${name}`);
    }
    instance = newInstance;
    await waitForInstanceReady(SERVICE_ID, name, ctx);
  }
  return instance;
}
