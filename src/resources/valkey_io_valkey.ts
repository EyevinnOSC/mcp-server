import {
  Context,
  createInstance,
  getInstance,
  getPortsForInstance
} from '@osaas/client-core';
import { delay } from './util.js';

const SERVICE_ID = 'valkey-io-valkey';

export async function createValkeyInstance(ctx: Context, name: string) {
  const serviceAccessToken = await ctx.getServiceAccessToken(SERVICE_ID);
  const instance = await getInstance(ctx, SERVICE_ID, name, serviceAccessToken);
  if (instance) {
    throw new Error(`Instance with name ${name} already exists`);
  }

  if (!(await createInstance(ctx, SERVICE_ID, serviceAccessToken, { name }))) {
    throw new Error(`Failed to create instance with name ${name}`);
  }
  await delay(5000);

  const ports = await getPortsForInstance(
    ctx,
    SERVICE_ID,
    name,
    serviceAccessToken
  );
  const redisPort = ports.find((port) => port.internalPort == 6379);
  if (!redisPort) {
    throw new Error(`Failed to get redis port for instance ${name}`);
  }
  return `redis://${redisPort.externalIp}:${redisPort.externalPort}`;
}
