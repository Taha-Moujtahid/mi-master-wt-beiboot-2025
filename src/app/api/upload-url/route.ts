// app/api/upload-url/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

const s3 = new S3Client({
  region: 'us-east-1',
  endpoint: process.env.MINIO_PUBLIC_URL,
  credentials: {
    accessKeyId: process.env.MINIO_ACCESS_KEY!,
    secretAccessKey: process.env.MINIO_SECRET_KEY!,
  },
  forcePathStyle: true,
})

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const filename = searchParams.get('filename')
  const filetype = searchParams.get('filetype')

  if (!filename || !filetype) {
    return NextResponse.json({ error: 'Missing filename or filetype' }, { status: 400 })
  }

  const command = new PutObjectCommand({
    Bucket: process.env.MINIO_BUCKET!,
    Key: filename,
    ContentType: filetype,
    ACL: 'public-read', // Optional: Set ACL if you want the file to be publicly accessible
  })

  const url = await getSignedUrl(s3, command, { expiresIn: 60 })

  return NextResponse.json({ url })
}
