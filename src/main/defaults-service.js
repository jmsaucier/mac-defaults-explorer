const { execFile } = require('node:child_process');
const { promisify } = require('node:util');
const plist = require('plist');

const execFileAsync = promisify(execFile);
const MAX_BUFFER = 10 * 1024 * 1024;
const SAFE_INPUT = /^[\w\-./:@+\s]+$/;

function validateArg(value, label) {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new Error(`${label} is required.`);
  }

  if (!SAFE_INPUT.test(value)) {
    throw new Error(`${label} contains unsupported characters.`);
  }

  return value.trim();
}

async function runDefaults(args) {
  try {
    const { stdout, stderr } = await execFileAsync('defaults', args, {
      maxBuffer: MAX_BUFFER,
      encoding: 'utf8',
    });

    return { stdout, stderr };
  } catch (error) {
    const details = error.stderr || error.stdout || error.message;
    throw new Error(details.trim() || 'defaults command failed.');
  }
}

function parseDomains(stdout) {
  return stdout
    .split(',')
    .map((domain) => domain.trim())
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b));
}

async function listDomains() {
  const { stdout } = await runDefaults(['domains']);
  return parseDomains(stdout);
}

async function readDomainRaw(domain) {
  const safeDomain = validateArg(domain, 'domain');
  const { stdout } = await runDefaults(['read', safeDomain]);
  return stdout;
}

async function readDomainAsObject(domain) {
  const safeDomain = validateArg(domain, 'domain');
  const { stdout } = await runDefaults(['export', safeDomain, '-']);

  try {
    return plist.parse(stdout);
  } catch (error) {
    throw new Error(`Failed to parse plist output for "${safeDomain}": ${error.message}`);
  }
}

async function readType(domain, key) {
  const safeDomain = validateArg(domain, 'domain');
  const safeKey = validateArg(key, 'key');
  const { stdout } = await runDefaults(['read-type', safeDomain, safeKey]);
  return stdout.trim();
}

async function findInDefaults(query) {
  const safeQuery = validateArg(query, 'query');
  const { stdout } = await runDefaults(['find', safeQuery]);
  return stdout;
}

module.exports = {
  listDomains,
  readDomainRaw,
  readDomainAsObject,
  readType,
  findInDefaults,
};
