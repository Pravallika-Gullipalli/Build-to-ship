import { Client, Account, Databases, Storage, Avatars, ID, Query, Permission, Role } from 'appwrite';

const endpoint = import.meta.env.VITE_APPWRITE_ENDPOINT || 'https://fra.cloud.appwrite.io/v1';
const projectId = import.meta.env.VITE_APPWRITE_PROJECT_ID || '6ab68dd6001906beefb1';

export const client = new Client();

if (endpoint) {
  client.setEndpoint(endpoint);
}

if (projectId) {
  client.setProject(projectId);
}

export const account = new Account(client);
export const databases = new Databases(client);
export const storage = new Storage(client);
export const avatars = new Avatars(client);
export { ID, Query, Permission, Role };

export default client;

