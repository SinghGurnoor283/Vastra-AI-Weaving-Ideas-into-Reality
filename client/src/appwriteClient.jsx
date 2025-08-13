import { Client, Storage, ID, Role, Permission, Account } from 'appwrite'; 

const client = new Client()
  .setEndpoint(import.meta.env.VITE_APPWRITE_ENDPOINT)
  .setProject(import.meta.env.VITE_APPWRITE_PROJECT_ID);

const storage = new Storage(client);
const account = new Account(client); 

export { storage, ID, Role, Permission, account }; 