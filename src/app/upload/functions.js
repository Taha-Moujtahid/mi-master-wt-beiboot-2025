'use server';

import fs from 'fs';
import path from 'path';

export async function uploadImage(formData) {
  const file = formData.get('file');

  const allowed = ['image/jpeg', 'image/png'];
  if (!allowed.includes(file.type)) {
    throw new Error('Nur JPEG oder PNG erlaubt');
  }

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  const uploadDir = path.join(process.cwd(), 'public', 'uploads');
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  const filePath = path.join(uploadDir, file.name);
  fs.writeFileSync(filePath, buffer);


  const exiftool = require("exiftool-vendored").exiftool;
  exiftool.version().then((version) => {
    console.log(`ExifTool version: ${version}`);
  });

  exiftool
  .read(filePath)
  .then((tags /*: Tags */) =>
    console.log(
      `Make: ${tags.Make}, Model: ${tags.Model}, Errors: ${tags.errors}`,
    ),
  )
  .catch((err) => console.error("Something terrible happened: ", err));


  return { success: true, path: `/uploads/${file.name}` };
}