import axios from 'axios';
import chalk from 'chalk';
import { getConfig, setConfig } from './config.js';

const PROD_BASE = 'https://quickbooks.api.intuit.com/v3/company';
const SANDBOX_BASE = 'https://sandbox-quickbooks.api.intuit.com/v3/company';
const TOKEN_URL = 'https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer';

function getBaseUrl(config) {
  return config.sandbox ? SANDBOX_BASE : PROD_BASE;
}

export async function refreshAccessToken() {
  const config = getConfig();

  if (!config.refreshToken) {
    throw new Error('No refresh token available. Please re-authenticate.');
  }

  const credentials = Buffer.from(`${config.clientId}:${config.clientSecret}`).toString('base64');

  const response = await axios.post(TOKEN_URL, new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: config.refreshToken,
  }), {
    headers: {
      'Authorization': `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded',
      'Accept': 'application/json',
    },
  });

  const { access_token, refresh_token, expires_in } = response.data;
  const expiry = Date.now() + (expires_in * 1000);

  setConfig({
    accessToken: access_token,
    refreshToken: refresh_token || config.refreshToken,
    tokenExpiry: expiry,
  });

  return access_token;
}

export function createClient() {
  const config = getConfig();
  const baseUrl = getBaseUrl(config);

  const client = axios.create({
    baseURL: `${baseUrl}/${config.realmId}`,
    headers: {
      'Authorization': `Bearer ${config.accessToken}`,
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    },
  });

  // Auto-refresh on 401
  client.interceptors.response.use(
    (response) => response,
    async (error) => {
      if (error.response?.status === 401 && config.refreshToken) {
        try {
          const newToken = await refreshAccessToken();
          error.config.headers['Authorization'] = `Bearer ${newToken}`;
          return client.request(error.config);
        } catch (refreshError) {
          throw new Error('Authentication failed. Please re-authenticate with: quickbooks auth login');
        }
      }

      const apiError = error.response?.data?.Fault;
      if (apiError) {
        const messages = apiError.Error?.map(e => e.Message).join(', ') || 'Unknown API error';
        throw new Error(`QuickBooks API Error: ${messages}`);
      }

      throw error;
    }
  );

  return client;
}

export async function query(sql) {
  const client = createClient();
  const response = await client.get('/query', {
    params: { query: sql, minorversion: 70 },
  });
  return response.data.QueryResponse;
}

export async function getEntity(entity, id) {
  const client = createClient();
  const response = await client.get(`/${entity.toLowerCase()}/${id}`, {
    params: { minorversion: 70 },
  });
  return response.data[entity];
}

export async function createEntity(entity, data) {
  const client = createClient();
  const response = await client.post(`/${entity.toLowerCase()}`, data, {
    params: { minorversion: 70 },
  });
  return response.data[entity];
}

export async function updateEntity(entity, data) {
  const client = createClient();
  const response = await client.post(`/${entity.toLowerCase()}`, data, {
    params: { minorversion: 70, operation: 'update' },
  });
  return response.data[entity];
}

export async function deleteEntity(entity, data) {
  const client = createClient();
  const response = await client.post(`/${entity.toLowerCase()}`, data, {
    params: { minorversion: 70, operation: 'delete' },
  });
  return response.data[entity];
}

export async function getReport(reportName, params = {}) {
  const client = createClient();
  const response = await client.get(`/reports/${reportName}`, {
    params: { ...params, minorversion: 70 },
  });
  return response.data;
}
