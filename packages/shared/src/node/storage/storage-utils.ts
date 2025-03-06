import { Buffer } from "node:buffer"
import { Readable } from "node:stream"
import { getStreamAsBuffer } from 'get-stream';

import { BlobInputType } from "@gepick/shared/node"

export async function toBuffer(input: BlobInputType): Promise<Buffer> {
  return input instanceof Readable
    ? await getStreamAsBuffer(input)
    : input instanceof Buffer
      ? input
      : Buffer.from(input as any);
}
