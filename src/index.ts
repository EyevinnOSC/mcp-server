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
import { zodToJsonSchema } from 'zod-to-json-schema';
import { CreateDatabaseSchema } from './schemas.js';
import { z } from 'zod';
import { createValkeyInstance } from './resources/valkey_io_valkey.js';
import { handleOscResourceRequest, listOscResources } from './resources/osc.js';
import {
  handleLocalResourceRequest,
  listLocalResources
} from './resources/local.js';

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
      tools: [
        {
          name: 'create_db',
          description: 'Create a new database instance',
          inputSchema: zodToJsonSchema(CreateDatabaseSchema)
        }
      ]
    }));

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      try {
        if (!request.params.arguments) {
          throw new Error('Arguments are required');
        }

        switch (request.params.name) {
          case 'create_db': {
            const args = CreateDatabaseSchema.parse(request.params.arguments);
            const connectionUrl = await this.createDatabase(
              args.name,
              args.type
            );
            return { toolResult: connectionUrl };
          }

          default:
            throw new Error(`Unknown tool: ${request.params.name}`);
        }
      } catch (error) {
        if (error instanceof z.ZodError) {
          throw new Error(
            `Invalid arguments: ${error.errors
              .map((e) => `${e.path.join('.')}: ${e.message}`)
              .join(', ')}`
          );
        }
        throw error;
      }
    });
  }

  private async createDatabase(name: string, type: string): Promise<string> {
    switch (type) {
      case 'MemoryDb': {
        const connectionUrl = await createValkeyInstance(this.context, name);
        return connectionUrl;
      }
      default:
        throw new Error(`Unknown database type: ${type}`);
    }
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
