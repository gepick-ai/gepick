import {
  PutObjectAclCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";

import { BlobInputType, S3StorageConfig, toBuffer } from "@gepick/core/node"

class S3StorageProvider {
  private client: S3Client;

  constructor(public readonly bucket: string, config: S3StorageConfig) {
    this.client = new S3Client({
      region: 'ap-northeast-1',
      // s3 client uses keep-alive by default to accelrate requests, and max requests queue is 50.
      // If some of them are long holding or dead without response, the whole queue will block.
      // By default no timeout is set for requests or connections, so we set them here.
      requestHandler: { requestTimeout: 60_000, connectionTimeout: 10_000 },
      ...config,
    });
  }

  async put(key: string, body: BlobInputType) {
    try {
      const blob = await toBuffer(body);
      const pubObjCmd = new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: blob,
        ContentType: 'image/png', // TODO(@jaylenchen): 暂时设置成png，之后需要想办法自动获取对应mime-type才行
      })

      // NOTE: 参考https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/client/s3/command/PutObjectAclCommand/
      const pubObjAclCmd = new PutObjectAclCommand({
        ACL: "public-read",
        Bucket: process.env.S3_BUCKET ?? "gepickfriends",
        Key: key,
      })

      await this.client.send(pubObjCmd);
      await this.client.send(pubObjAclCmd);

      // eslint-disable-next-line no-console
      console.log(`Object \`${key}\` put`);

      // `https://gepickfriends.s3.ap-northeast-1.amazonaws.com/wallpaper/jera_laguz_algiz-chengse.png`
      return `${process.env.S3_ACCESS_POINT ?? `https://gepickfriends.s3.ap-northeast-1.amazonaws.com`}/${key}`
    }
    catch (e) {
      console.error((e as Error).message)

      return ""
    }
  }
}

// 示例：s3 bucket s3://gepickfriends
export const s3StorageProvider = new S3StorageProvider(process.env.S3_BUCKET ?? "gepickfriends", {
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY_ID ?? "AKIATYB7F3G6MG533CRW",
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY ?? "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",
  },
})
