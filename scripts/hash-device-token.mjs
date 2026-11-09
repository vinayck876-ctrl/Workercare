import { createHash, randomBytes } from 'node:crypto';

const token = process.argv[2] || randomBytes(32).toString('hex');
const hash = createHash('sha256').update(token, 'utf8').digest('hex');
console.log('DEVICE TOKEN (store only on the ESP32; do not commit it):');
console.log(token);
console.log('\nSHA-256 HASH (store in private.device_credentials):');
console.log(hash);
