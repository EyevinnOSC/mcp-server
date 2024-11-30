import {
  ErrorCode,
  McpError,
  ReadResourceRequest
} from '@modelcontextprotocol/sdk/types.js';

export function listLocalResources() {
  return [
    {
      uri: `local://videos/myvideos`,
      name: 'My videos on local disk',
      description: 'List all videos on local disk',
      mimeType: 'application/json'
    }
  ];
}

export async function handleLocalResourceRequest(
  hostname: string,
  pathname: string,
  request: ReadResourceRequest
) {
  if (hostname === 'videos' && pathname === '/myvideos') {
    return {
      contents: []
    };
  } else {
    throw new McpError(
      ErrorCode.InvalidRequest,
      `Unknown Local resource: ${request.params.uri}`
    );
  }
}
