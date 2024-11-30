import { zodToJsonSchema } from 'zod-to-json-schema';
import { z } from 'zod';
import { CreateDatabaseSchema } from '../schemas.js';
import { createValkeyInstance } from '../resources/valkey_io_valkey.js';
import { Context } from '@osaas/client-core';
import { CallToolRequest } from '@modelcontextprotocol/sdk/types.js';

export function listOscTools() {
  return [
    {
      name: 'osc_create_db',
      description:
        'Create a new database instance in Eyevinn Open Source Cloud',
      inputSchema: zodToJsonSchema(CreateDatabaseSchema)
    }
  ];
}

export async function handleOscToolRequest(
  request: CallToolRequest,
  context: Context
) {
  try {
    if (!request.params.arguments) {
      throw new Error('Arguments are required');
    }

    switch (request.params.name) {
      case 'osc_create_db': {
        const args = CreateDatabaseSchema.parse(request.params.arguments);
        const connectionUrl = await createDatabase(
          args.name,
          args.type,
          context
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
}

export async function createDatabase(
  name: string,
  type: string,
  context: Context
) {
  switch (type) {
    case 'MemoryDb': {
      const connectionUrl = await createValkeyInstance(context, name);
      return connectionUrl;
    }
    default:
      throw new Error(`Unknown database type: ${type}`);
  }
}
