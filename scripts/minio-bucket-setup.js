#!/usr/bin/env node

// MinIO bucket setup script (Node.js)
const { execSync } = require('child_process');
const http = require('http');

const MINIO_HOST = process.env.MINIO_HOST || 'minio';
const MINIO_PORT = process.env.MINIO_PORT || 9000;
const MINIO_USER = process.env.MINIO_ROOT_USER || 'minioadmin';
const MINIO_PASS = process.env.MINIO_ROOT_PASSWORD || 'minioadmin';
const BUCKET = process.env.MINIO_BUCKET || 'beiboot';

function waitForMinio(retries = 60, delayMs = 2000) {
  return new Promise((resolve, reject) => {
    let attempts = 0;
    function tryConnect() {
      const req = http.request({ host: MINIO_HOST, port: MINIO_PORT, path: '/minio/health/ready', timeout: 1000 }, res => {
        if (res.statusCode === 200) return resolve();
        retry();
      });
      req.on('error', retry);
      req.on('timeout', retry);
      req.end();
    }
    function retry() {
      if (++attempts >= retries) return reject(new Error('MinIO not available after waiting.'));
      setTimeout(tryConnect, delayMs);
    }
    tryConnect();
  });
}

async function main() {
  await waitForMinio();
  // Install mc if not present
  try { execSync('mc --version', { stdio: 'ignore' }); } catch {
    execSync('wget https://dl.min.io/client/mc/release/linux-amd64/mc -O /usr/bin/mc && chmod +x /usr/bin/mc');
  }
  execSync(`mc alias set local http://${MINIO_HOST}:${MINIO_PORT} ${MINIO_USER} ${MINIO_PASS}`);
  execSync(`mc mb --ignore-existing local/${BUCKET}`);
  console.log(`Bucket '${BUCKET}' ensured in MinIO.`);
}

main().catch(e => { console.error(e); process.exit(1); });
