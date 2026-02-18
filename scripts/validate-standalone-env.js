#!/usr/bin/env node
/* eslint-disable no-console */
'use strict';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function fail(message) {
  console.error(`[standalone-env] ${message}`);
  process.exit(1);
}

function readRequired(name) {
  const value = process.env[name];
  if (!value || value.trim().length === 0) {
    fail(`Missing required environment variable: ${name}`);
  }
  return value.trim();
}

function requireUuid(name) {
  const value = readRequired(name);
  if (!UUID_PATTERN.test(value)) {
    fail(`${name} must be a valid UUID (received: "${value}")`);
  }
}

function requireHttpsUrl(name) {
  const value = readRequired(name);
  let parsed;
  try {
    parsed = new URL(value);
  } catch {
    fail(`${name} must be a valid URL (received: "${value}")`);
  }
  if (parsed.protocol !== 'https:') {
    fail(`${name} must use https:// (received: "${value}")`);
  }
}

const mode = (process.env.VITE_DATA_SERVICE_MODE || 'mock').trim();
if (!['mock', 'standalone'].includes(mode)) {
  fail(`VITE_DATA_SERVICE_MODE must be "mock" or "standalone" (received: "${mode}")`);
}

if (mode === 'standalone') {
  requireUuid('VITE_AAD_CLIENT_ID');
  requireUuid('VITE_AAD_TENANT_ID');
  requireHttpsUrl('VITE_SP_HUB_URL');
}

console.log(`[standalone-env] Validation passed for mode="${mode}".`);
