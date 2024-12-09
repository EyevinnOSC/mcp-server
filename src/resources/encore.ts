import { Context, createInstance, getInstance } from '@osaas/client-core';
import { waitForInstanceReady } from './util.js';
import { Encore, EncoreConfig } from '@osaas/client-services';

const SERVICE_ID = 'encore';

export async function createEncoreInstance(ctx: Context, name: string) {
  const serviceAccessToken = await ctx.getServiceAccessToken(SERVICE_ID);
  let instance: Encore = await getInstance(
    ctx,
    SERVICE_ID,
    name,
    serviceAccessToken
  );
  if (!instance) {
    const config: EncoreConfig = { name };
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
    jobs: new URL('/encoreJobs', instance.url).toString(),
    url: instance.url.replace(/\/$/, '')
  };
}

export async function getEncoreInstance(ctx: Context, name: string) {
  const serviceAccessToken = await ctx.getServiceAccessToken(SERVICE_ID);
  const instance: Encore = await getInstance(
    ctx,
    SERVICE_ID,
    name,
    serviceAccessToken
  );
  if (!instance) {
    throw new Error(`Encore Instance ${name} not found`);
  }
  return {
    jobs: new URL('/encoreJobs', instance.url).toString(),
    url: instance.url.replace(/\/$/, '')
  };
}
