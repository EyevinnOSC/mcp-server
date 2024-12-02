import { Context, createInstance, getInstance } from '@osaas/client-core';
import { waitForInstanceReady } from './util.js';
import {
  EyevinnEncoreCallbackListener,
  EyevinnEncoreCallbackListenerConfig
} from '@osaas/client-services';

const SERVICE_ID = 'eyevinn-encore-callback-listener';

export async function createEncoreCallbackListenerInstance(
  ctx: Context,
  name: string,
  redisUrl: string,
  encoreUrl: string
) {
  const serviceAccessToken = await ctx.getServiceAccessToken(SERVICE_ID);
  let instance: EyevinnEncoreCallbackListener = await getInstance(
    ctx,
    SERVICE_ID,
    name,
    serviceAccessToken
  );
  if (!instance) {
    const config: EyevinnEncoreCallbackListenerConfig = {
      name,
      RedisUrl: redisUrl,
      EncoreUrl: encoreUrl,
      RedisQueue: 'package'
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
  }

  return {
    url: new URL('/encoreCallback', instance.url).toString()
  };
}
