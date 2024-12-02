#!/usr/bin/env node

import { Context } from '@osaas/client-core';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ErrorCode,
  ListResourcesRequestSchema,
  ListToolsRequestSchema,
  McpError,
  ReadResourceRequestSchema
} from '@modelcontextprotocol/sdk/types.js';
import dotenv from 'dotenv';
import { handleOscResourceRequest, listOscResources } from './resources/osc.js';
import {
  handleLocalResourceRequest,
  listLocalResources
} from './resources/local.js';
import { handleOscToolRequest, listOscTools } from './tools/osc.js';

dotenv.config();

const OSC_ACCESS_TOKEN = process.env.OSC_ACCESS_TOKEN;

if (!OSC_ACCESS_TOKEN) {
  console.error('OSC_ACCESS_TOKEN environment variable is not set');
  process.exit(1);
}

class OscMcpServer {
  private server: Server;
  private context: Context;

  constructor() {
    this.server = new Server(
      {
        name: 'eyevinn-osc-mcp-server',
        version: '0.1.0'
      },
      {
        capabilities: {
          resources: {},
          tools: {}
        }
      }
    );

    this.context = new Context({ personalAccessToken: OSC_ACCESS_TOKEN });
    this.setupHandlers();
    this.setupErrorHandling();
  }

  private setupErrorHandling(): void {
    this.server.onerror = (error) => {
      console.error('[MCP Error]', error);
    };

    process.on('SIGINT', async () => {
      await this.server.close();
      process.exit(0);
    });
  }

  private setupHandlers(): void {
    this.setupResourceHandlers();
    this.setupToolHandlers();
  }

  private setupResourceHandlers(): void {
    this.server.setRequestHandler(ListResourcesRequestSchema, async () => ({
      resources: listOscResources().concat(listLocalResources())
    }));

    this.server.setRequestHandler(
      ReadResourceRequestSchema,
      async (request) => {
        const url = new URL(request.params.uri);
        switch (url.protocol) {
          case 'eyevinnosc:':
            return await handleOscResourceRequest(
              url.hostname,
              url.pathname,
              request,
              this.context
            );
          case 'local:':
            return await handleLocalResourceRequest(
              url.hostname,
              url.pathname,
              request
            );
          default:
            throw new McpError(
              ErrorCode.InvalidRequest,
              `Unknown resource: ${request.params.uri}`
            );
        }
      }
    );
  }

  private setupToolHandlers(): void {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: listOscTools()
    }));

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      if (request.params.name.startsWith('osc_')) {
        return await handleOscToolRequest(request, this.context);
      } else {
        throw new McpError(
          ErrorCode.InvalidRequest,
          `Unknown tool: ${request.params.name}`
        );
      }
    });
  }

  async run(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);

    // Although this is just an informative message, we must log to stderr,
    // to avoid interfering with MCP communication that happens on stdout
    console.error('Eyevinn OSC MCP server running on stdio');
  }
}

const server = new OscMcpServer();
server.run().catch(console.error);
