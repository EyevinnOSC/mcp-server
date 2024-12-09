import { Context, getInstance, getPortsForInstance } from '@osaas/client-core';
import { delay, waitForInstanceReady } from './util.js';
import {
  ValkeyIoValkey,
  ValkeyIoValkeyConfig,
  createValkeyIoValkeyInstance
} from '@osaas/client-services';

const SERVICE_ID = 'valkey-io-valkey';

export async function createValkeyInstance(ctx: Context, name: string) {
  const serviceAccessToken = await ctx.getServiceAccessToken(SERVICE_ID);
  let instance: ValkeyIoValkey = await getInstance(
    ctx,
    SERVICE_ID,
    name,
    serviceAccessToken
  );
  if (!instance) {
    const config: ValkeyIoValkeyConfig = { name };
    const newInstance = await createValkeyIoValkeyInstance(ctx, config);
    await waitForInstanceReady(SERVICE_ID, name, ctx);
    await delay(2000);
    instance = newInstance;
  }

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

export async function getValkeyInstance(ctx: Context, name: string) {
  const serviceAccessToken = await ctx.getServiceAccessToken(SERVICE_ID);
  const instance: ValkeyIoValkey = await getInstance(
    ctx,
    SERVICE_ID,
    name,
    serviceAccessToken
  );
  if (!instance) {
    throw new Error(`Valkey Instance ${name} not found`);
  }

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
