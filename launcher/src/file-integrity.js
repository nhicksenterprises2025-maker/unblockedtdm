const crypto = require('node:crypto');
const fs = require('node:fs');

function normalizedHash(value) {
  return String(value || '').trim().toLowerCase();
}

async function sha256(file) {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash('sha256');
    const input = fs.createReadStream(file);
    input.on('error', reject);
    input.on('data', (chunk) => hash.update(chunk));
    input.on('end', () => resolve(hash.digest('hex')));
  });
}

async function verifyFile(file, expected) {
  const expectedHash = normalizedHash(expected);
  const hash = await sha256(file);
  return {
    valid: !expectedHash || hash === expectedHash,
    hash,
    expected: expectedHash || null
  };
}

async function inspectCachedFile(file, expected) {
  const expectedHash = normalizedHash(expected);
  if (!fs.existsSync(file)) {
    return { status: 'missing', downloaded: false, hash: null, expected: expectedHash || null };
  }
  if (!expectedHash) {
    return { status: 'unverifiable', downloaded: false, hash: null, expected: null };
  }

  try {
    const verification = await verifyFile(file, expectedHash);
    return {
      status: verification.valid ? 'verified' : 'stale',
      downloaded: verification.valid,
      ...verification
    };
  } catch {
    return { status: 'stale', downloaded: false, hash: null, expected: expectedHash };
  }
}

module.exports = { inspectCachedFile, normalizedHash, sha256, verifyFile };
