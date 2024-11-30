import {
  ErrorCode,
  McpError,
  ReadResourceRequest
} from '@modelcontextprotocol/sdk/types.js';
import { Context, listSubscriptions } from '@osaas/client-core';

export function listOscResources() {
  return [
    {
      uri: `eyevinnosc://catalog/myactiveservices`,
      name: 'My active services',
      description: 'List all my active services in Eyevinn Open Source Cloud',
      mimeType: 'application/json'
    }
  ];
}

export async function handleOscResourceRequest(
  hostname: string,
  pathname: string,
  request: ReadResourceRequest,
  context: Context
) {
  if (hostname === 'catalog' && pathname === '/myactiveservices') {
    const subscriptions = await listSubscriptions(context);
    const activeSubscriptions = subscriptions.map((subscription) => ({
      serviceId: subscription.serviceId
    }));
    return {
      contents: [
        {
          uri: request.params.uri,
          mimeType: 'application/json',
          text: JSON.stringify(activeSubscriptions, null, 2)
        }
      ]
    };
  } else {
    throw new McpError(
      ErrorCode.InvalidRequest,
      `Unknown OSC resource: ${request.params.uri}`
    );
  }
}
