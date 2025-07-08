import { S3Client, ListObjectsV2Command } from '@aws-sdk/client-s3'
import { NextResponse } from 'next/server'

const s3 = new S3Client({
  region: 'us-east-1',
  endpoint: process.env.MINIO_PUBLIC_URL,
  credentials: {
    accessKeyId: process.env.MINIO_ACCESS_KEY, // Optional, kann man auch weglassen wenn public
    secretAccessKey: process.env.MINIO_SECRET_KEY,
  },
  forcePathStyle: true,
})

const BUCKET_NAME = process.env.MINIO_BUCKET

export async function GET() {
  try {
    const listCommand = new ListObjectsV2Command({
      Bucket: BUCKET_NAME,
      Prefix: '',
    })

    const { Contents } = await s3.send(listCommand)

    if (!Contents || Contents.length === 0) {
      return NextResponse.json({ images: [] })
    }

    const baseUrl = process.env.MINIO_PUBLIC_URL.replace(/\/$/, '') // ohne abschließenden Slash

    const images = Contents
      .filter((obj) => obj.Key)
      .map((obj) => ({
        key: obj.Key,
        url: `${baseUrl}/${BUCKET_NAME}/${encodeURIComponent(obj.Key)}`,
      }))

    return NextResponse.json({ images })
  } catch (error) {
    console.error('[Gallery API]', error)
    return NextResponse.json(
      { error: 'Fehler beim Laden der Bilder' },
      { status: 500 }
    )
  }
}
