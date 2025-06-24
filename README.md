# Eyevinn Open Source Cloud MCP Server

[![smithery badge](https://smithery.ai/badge/@osaas/mcp-server)](https://smithery.ai/server/@osaas/mcp-server)

This MCP server provides MCP tools for [Eyevinn Open Source Cloud](www.osaas.io) that requires local computer access, for example to upload a file to a storage bucket in OSC. MCP tools for architecting and building solutions with OSC is provided by the remote MCP endpoint that can be accessed using the [OSC remote MCP client](https://www.npmjs.com/package/@osaas/client-mcp).

<a href="https://glama.ai/mcp/servers/ku9s6ow21e"><img width="380" height="200" src="https://glama.ai/mcp/servers/ku9s6ow21e/badge" alt="Eyevinn Open Source Cloud Server MCP server" /></a>

### Features provided by the local MCP server

- Upload a file to a MinIO storage bucket in OSC.

## Setup

### Installing via Smithery

To install Eyevinn Open Source Cloud MCP Server for Claude Desktop automatically via [Smithery](https://smithery.ai/server/@osaas/mcp-server):

```bash
npx -y @smithery/cli install @osaas/mcp-server --client claude
```

### Personal Access Token

- If you have not already done so, sign up for an [Eyevinn OSC account](https://app.osaas.io).
- In the Eyevinn OSC web console go to [API settings](https://app.osaas.io/dashboard/settings/api) (in Settings > API settings)
- Copy the Personal Access Token

### Usage with Claude Desktop

To use this with Claude Desktop, add the following to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "local-mcp-osc": {
      "command": "npx",
      "args": ["-y", "@osaas/mcp-server"],
      "env": {
        "OSC_ACCESS_TOKEN": "<YOUR_TOKEN>"
      }
    },
    "remote-mcp-osc": {
      "command": "npx",
      "args": ["-y", "@osaas/client-mcp"],
      "env": {
        "OSC_ACCESS_TOKEN": "<YOUR_TOKEN>"
      }
    }
  }
}
```

## Development

```
npx @modelcontextprotocol/inspector \
  -e OSC_ACCESS_TOKEN=<osc-access-token> \
  npx tsx src/index.ts
```

## License

This MCP server is licensed under the MIT License. This means you are free to use, modify, and distribute the software, subject to the terms and conditions of the MIT License. For more details, please see the LICENSE file in the project repository.
