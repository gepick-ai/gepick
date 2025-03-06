import type { Readable } from 'node:stream';
import type { Buffer } from 'node:buffer';
import { S3ClientConfigType } from '@aws-sdk/client-s3';

export type BlobInputType = Buffer | Readable | string;
export type BlobOutputType = Readable;

export interface PutObjectMetadata {
  contentType?: string
  contentLength?: number
  checksumCRC32?: string
}

export type S3StorageConfig = S3ClientConfigType;
