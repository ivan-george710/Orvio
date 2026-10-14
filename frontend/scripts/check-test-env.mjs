import { readFileSync } from 'node:fs';
import { loadEnvFile } from 'node:process';

const before = Object.fromEntries(['ORVIO_TEST_EMAIL', 'ORVIO_TEST_PASSWORD'].map((k) => [k, process.env[k] !== undefined]));
loadEnvFile('.env.local');
loadEnvFile('.env.test.local');
const text = readFileSync('.env.test.local', 'utf8');
for (const name of ['ORVIO_TEST_EMAIL', 'ORVIO_TEST_PASSWORD']) {
  const lines = text.split(/\r?\n/).filter((line) => line.trimStart().startsWith(name + '='));
  const raw = lines[0]?.slice(lines[0].indexOf('=') + 1).trim() || '';
  const quoted = raw.startsWith('"') || raw.startsWith("'");
  console.log(name, JSON.stringify({
    configured: Boolean(process.env[name]),
    duplicateDefinitions: lines.length > 1,
    alreadySetBeforeLoadingFiles: before[name],
    containsUnquotedHash: raw.includes('#') && !quoted,
    surroundingWhitespaceInLoadedValue: process.env[name] !== process.env[name]?.trim(),
    rawValueLength: raw.length,
    loadedValueLength: process.env[name]?.length,
  }));
}
const local = readFileSync('.env.local', 'utf8');
console.log('Test keys also defined in .env.local:', /^ORVIO_TEST_(EMAIL|PASSWORD)=/m.test(local));
