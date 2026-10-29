import z from 'zod/v4'

import { jsonValueSchema, type JSONValue } from '../json'

// Reuse the AI SDK's ProviderMetadata type so common's messages stay structurally
// compatible with the AI SDK's ModelMessage family (SharedV4ProviderMetadata).
// Defining a parallel type here caused SharedV4ProviderOptions / ProviderMetadata
// mismatches when bridging AI SDK messages into codebuff messages.
import type { ProviderMetadata as AiProviderMetadata } from 'ai'

export type ProviderMetadata = AiProviderMetadata

export const providerMetadataSchema: z.ZodType<ProviderMetadata> = z.record(
  z.string(),
  z.record(z.string(), jsonValueSchema.optional()),
)
