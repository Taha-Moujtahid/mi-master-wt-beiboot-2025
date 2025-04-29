import { NextResponse } from 'next/server';

import fs from 'fs';
import path from 'path';

export async function GET(request, { params }) {
  const { imageId } = await params;

  const uploadDir = path.join(process.cwd(), 'public', 'uploads');
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  const filePath = path.join(uploadDir, imageId+".jpg");


  const exiftool = require("exiftool-vendored").exiftool;
  exiftool.version().then((version) => {
    console.log(`ExifTool version: ${version}`);
  });

  var retTags = {};
  await exiftool
  .read(filePath)
  .then((tags /*: Tags */) => {
    retTags = tags;
    console.log(tags)
  }
  )
  .catch((err) => console.error("Something terrible happened: ", err));

  return NextResponse.json({
    imageId,
    tags: retTags,
  });
  
}
