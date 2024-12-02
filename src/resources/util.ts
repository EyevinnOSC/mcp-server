import { Context } from '@osaas/client-core';
import { getInstanceHealth } from '@osaas/client-core';

export const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));

export async function waitForInstanceReady(
  serviceId: string,
  name: string,
  ctx: Context
) {
  const serviceAccessToken = await ctx.getServiceAccessToken(serviceId);
  let instanceOk = false;
  while (!instanceOk) {
    await delay(1000);
    const status = await getInstanceHealth(
      ctx,
      serviceId,
      name,
      serviceAccessToken
    );
    if (status && status === 'running') {
      instanceOk = true;
    }
  }
}
