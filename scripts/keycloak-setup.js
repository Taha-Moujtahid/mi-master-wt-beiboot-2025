#!/usr/bin/env node

/**
 * Node.js Keycloak setup script
 * - Creates a realm if it does not exist
 * - Creates a client if it does not exist
 * - Creates a user if it does not exist
 * - Sets user password
 * - Writes config to .env files for frontend and API
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');

const KEYCLOAK_URL = process.env.KEYCLOAK_URL || 'http://keycloak:8080';
const KEYCLOAK_REALM = process.env.KEYCLOAK_REALM || 'beiboot';
const KEYCLOAK_CLIENT_ID = process.env.KEYCLOAK_CLIENT_ID || 'frontend';
const KEYCLOAK_USER = process.env.KEYCLOAK_USER || 'user';
const KEYCLOAK_PASSWORD = process.env.KEYCLOAK_PASSWORD || 'password';
const KEYCLOAK_REDIRECT_URI = process.env.KEYCLOAK_REDIRECT_URI || 'http://localhost:3000/*';
const ADMIN_USER = process.env.KEYCLOAK_ADMIN_USER || 'admin';
const ADMIN_PASS = process.env.KEYCLOAK_ADMIN_PASS || 'admin';

const FRONTEND_ENV_PATH = path.resolve(__dirname, '../apps/frontend/.env.local');
const API_ENV_PATH = path.resolve(__dirname, '../apps/api/.env');


async function waitForKeycloak(retries = 60, delayMs = 2000) {
  for (let i = 0; i < retries; i++) {
    try {
      await axios.get(`${KEYCLOAK_URL}/realms/master`);
      return;
    } catch (e) {
      if (i === retries - 1) throw new Error('Keycloak not available after waiting.');
      await new Promise(res => setTimeout(res, delayMs));
    }
  }
}

async function getAdminToken() {
  const params = new URLSearchParams();
  params.append('username', ADMIN_USER);
  params.append('password', ADMIN_PASS);
  params.append('grant_type', 'password');
  params.append('client_id', 'admin-cli');
  const res = await axios.post(
    `${KEYCLOAK_URL}/realms/master/protocol/openid-connect/token`,
    params
  );
  return res.data.access_token;
}

async function realmExists(token) {
  try {
    await axios.get(`${KEYCLOAK_URL}/admin/realms/${KEYCLOAK_REALM}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return true;
  } catch (e) {
    return false;
  }
}

async function createRealm(token) {
  await axios.post(
    `${KEYCLOAK_URL}/admin/realms`,
    { realm: KEYCLOAK_REALM, enabled: true },
    { headers: { Authorization: `Bearer ${token}` } }
  );
}

async function getClient(token) {
  const res = await axios.get(
    `${KEYCLOAK_URL}/admin/realms/${KEYCLOAK_REALM}/clients?clientId=${KEYCLOAK_CLIENT_ID}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return res.data[0];
}

async function createClient(token, secret) {
  await axios.post(
    `${KEYCLOAK_URL}/admin/realms/${KEYCLOAK_REALM}/clients`,
    {
      clientId: KEYCLOAK_CLIENT_ID,
      secret,
      enabled: true,
      redirectUris: [KEYCLOAK_REDIRECT_URI],
      publicClient: false,
      protocol: 'openid-connect',
    },
    { headers: { Authorization: `Bearer ${token}` } }
  );
}

async function updateClientSecret(token, clientId, secret) {
  await axios.put(
    `${KEYCLOAK_URL}/admin/realms/${KEYCLOAK_REALM}/clients/${clientId}/client-secret`,
    { value: secret },
    { headers: { Authorization: `Bearer ${token}` } }
  );
}

async function getUser(token) {
  const res = await axios.get(
    `${KEYCLOAK_URL}/admin/realms/${KEYCLOAK_REALM}/users?username=${KEYCLOAK_USER}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return res.data[0];
}

async function createUser(token) {
  await axios.post(
    `${KEYCLOAK_URL}/admin/realms/${KEYCLOAK_REALM}/users`,
    {
      username: KEYCLOAK_USER,
      enabled: true,
      emailVerified: true,
    },
    { headers: { Authorization: `Bearer ${token}` } }
  );
}

async function setUserPassword(token, userId) {
  await axios.put(
    `${KEYCLOAK_URL}/admin/realms/${KEYCLOAK_REALM}/users/${userId}/reset-password`,
    {
      type: 'password',
      value: KEYCLOAK_PASSWORD,
      temporary: false,
    },
    { headers: { Authorization: `Bearer ${token}` } }
  );
}

function randomSecret(length = 64) {
  return Array.from({ length }, () => Math.floor(Math.random() * 16).toString(16)).join('');
}

const crypto = require('crypto');
async function writeEnvFiles(secret) {
  const issuer = `${KEYCLOAK_URL}/realms/${KEYCLOAK_REALM}`;
  const nextAuthSecret = crypto.randomBytes(32).toString('base64');
  // Fetch public key from Keycloak realm endpoint
  let publicKey = '';
  try {
    const res = await axios.get(`${KEYCLOAK_URL}/realms/${KEYCLOAK_REALM}`);
    publicKey = res.data.publicKey ? `-----BEGIN PUBLIC KEY-----\n${res.data.publicKey}\n-----END PUBLIC KEY-----` : '';
  } catch (e) {
    console.error('Failed to fetch Keycloak public key:', e.message);
  }
  const frontend = `NEXT_PUBLIC_KEYCLOAK_URL=${KEYCLOAK_URL}\nNEXT_PUBLIC_KEYCLOAK_REALM=${KEYCLOAK_REALM}\nNEXT_PUBLIC_KEYCLOAK_CLIENT_ID=${KEYCLOAK_CLIENT_ID}\nKEYCLOAK_CLIENT_ID=${KEYCLOAK_CLIENT_ID}\nKEYCLOAK_CLIENT_SECRET=${secret}\nKEYCLOAK_ISSUER=${issuer}\nNEXTAUTH_SECRET=${nextAuthSecret}\n`;
  fs.writeFileSync(FRONTEND_ENV_PATH, frontend);
  const api = `KEYCLOAK_URL=${KEYCLOAK_URL}\nKEYCLOAK_REALM=${KEYCLOAK_REALM}\nKEYCLOAK_CLIENT_ID=${KEYCLOAK_CLIENT_ID}\nKEYCLOAK_CLIENT_SECRET=${secret}\nKEYCLOAK_ISSUER=${issuer}\nNEXTAUTH_SECRET=${nextAuthSecret}\nKEYCLOAK_PUBLIC_KEY=${publicKey}\n`;
  fs.writeFileSync(API_ENV_PATH, api);
}


(async () => {
  try {
    console.log('Waiting for Keycloak to be available...');
    await waitForKeycloak();
    console.log('Keycloak is available.');
    const token = await getAdminToken();
    if (!(await realmExists(token))) {
      await createRealm(token);
      console.log(`Realm '${KEYCLOAK_REALM}' created.`);
    } else {
      console.log(`Realm '${KEYCLOAK_REALM}' already exists.`);
    }
    let client = await getClient(token);
    let secret = randomSecret();
    if (!client || !client.id) {
      await createClient(token, secret);
      client = await getClient(token);
      if (client && client.id) {
        await updateClientSecret(token, client.id, secret);
      }
      console.log(`Client '${KEYCLOAK_CLIENT_ID}' created and secret set.`);
    } else {
      await updateClientSecret(token, client.id, secret);
      console.log(`Client '${KEYCLOAK_CLIENT_ID}' already exists, secret updated.`);
    }
    let user = await getUser(token);
    if (!user) {
      await createUser(token);
      user = await getUser(token);
      console.log(`User '${KEYCLOAK_USER}' created.`);
    }
    await setUserPassword(token, user.id);
  await writeEnvFiles(secret);
    console.log('Keycloak setup complete.');
  } catch (err) {
    console.error('Setup failed:', err.response?.data || err.message);
    process.exit(1);
  }
})();
