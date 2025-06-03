import { NextResponse } from 'next/server';

import fs from 'fs';
import path from 'path';

export async function GET(request, { params }) {
  const { imageId } = await params;

  const uploadDir = path.join(process.cwd(), 'public', 'uploads');
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  const filePath = path.join(uploadDir, imageId);

  const exiftool = require("exiftool-vendored").exiftool;
  exiftool.version().then((version) => {
    console.log(`ExifTool version: ${version}`);
  });

  var retTags = {};
  await exiftool
  .read(filePath)
  .then((tags /*: Tags */) => {
    retTags = tags;
  }
  )
  .catch((err) => console.error("Something terrible happened: ", err));

  return NextResponse.json({
    imageId,
    tags: retTags,
  });
  
}

function sanitizeTags(tags) {
  const sanitized = {};
  for (const [key, value] of Object.entries(tags)) {
    if ( value === null ||value === undefined) {
      sanitized[key] = ""; // Convert null/undefined to empty string for deletion
      continue; // Skip further processing for null/undefined values
    }

    if (typeof value === "object") {
      // Pass ExifDate/ExifDateTime objects as-is
      if (
        value._ctor === "ExifDateTime" ||
        value._ctor === "ExifDate"
      ) {
        sanitized[key] = value.rawValue;
      } else if (Array.isArray(value)) {
        sanitized[key] = value.map(v => 
          typeof v === "object" && (v._ctor === "ExifDateTime" || v._ctor === "ExifDate")
            ? v.rawValue
            : v.rawValue
        );
      } else if (typeof value.value === "number" || typeof value.value === "string") {
        sanitized[key] = value.value;
      }
      // else: skip complex objects ExifTool can't encode
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
}

export async function POST(request, context) {
  const { imageId } = await context.params;
  const uploadDir = path.join(process.cwd(), 'public', 'uploads');
  const filePath = path.join(uploadDir, imageId);

  const exiftool = require("exiftool-vendored").exiftool;
  const body = await request.json();
  const tags = body.tags || {};

  const sanitizedTags = sanitizeTags(tags);

  console.log("Tags to write:", sanitizedTags);

  try {
    await exiftool.write(filePath, sanitizedTags);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Error writing metadata:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
