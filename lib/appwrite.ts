import { Account, Avatars, Client, ID, Query, Storage, TablesDB } from "react-native-appwrite";

export const appwriteConfig = {
  endpoint: process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT!,
  projectId: process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID!,
  bucketId: process.env.EXPO_PUBLIC_APPWRITE_STORAGE_BUCKET_ID!,
  databaseId: process.env.EXPO_PUBLIC_APPWRITE_DATABASE_ID!,
  userTableId: process.env.EXPO_PUBLIC_APPWRITE_USERS_TABLE_ID!,
  videoTableId: process.env.EXPO_PUBLIC_APPWRITE_VIDEOS_TABLE_ID!,
};

const client = new Client()
  .setEndpoint(appwriteConfig.endpoint)
  .setProject(appwriteConfig.projectId);

const account = new Account(client);
const storage = new Storage(client);
const avatars = new Avatars(client);
const tablesDB = new TablesDB(client);

// TYPES
export interface AppwriteUser {
  accountId: string;
  email: string;
  username: string;
  avatar: string;
  id: string;
  [key: string]: any;
}
interface VideoPostForm {
  title: string;
  thumbnail: AppwriteFile | null;
  video: AppwriteFile | null;
  prompt: string;
  userId: string;
}

interface Post {
  id: string;
  title: string;
  thumbnail: string;
  video: string;
  prompt: string;
  userId: string;
  [key: string]: any;
}

interface AppwriteFile {
  name: string;
  type: string;
  size: number;
  uri: string;
}

export async function createUser(
  email: string,
  password: string,
  username: string,
): Promise<AppwriteUser> {
  try {
    const newAccount = await account.create({
      userId: ID.unique(),
      email,
      password,
      name: username,
    });

    const avatarUrl = `${appwriteConfig.endpoint}/avatars/initials?name=${encodeURIComponent(username)}&project=${appwriteConfig.projectId}`;

    await signIn(email, password);

    const userRow = await tablesDB.createRow({
      databaseId: appwriteConfig.databaseId,
      tableId: appwriteConfig.userTableId,
      rowId: ID.unique(),
      data: {
        accountId: newAccount.$id,
        email,
        username,
        avatar: avatarUrl,
      },
      permissions: [
        'read("any")', // adjust as needed
        'update("user:' + newAccount.$id + '")',
      ],
    });

    return userRow as unknown as AppwriteUser;
  } catch (err) {
    const error = err instanceof Error ? err : new Error("createUser failed");
    throw error;
  }
}

export async function signIn(email: string, password: string) {
  try {
    const session = await account.createEmailPasswordSession({ email, password });
    return session;
  } catch (err) {
    const error = err instanceof Error ? err : new Error("signIn failed");
    throw error;
  }
}

export async function getAccount() {
  try {
    const acct = await account.get();
    return acct;
  } catch (err) {
    const error = err instanceof Error ? err : new Error("getAccount failed");
    throw error;
  }
}

export async function getCurrentUser() {
  try {
    const acct = await getAccount();
    const response = await tablesDB.listRows({
      databaseId: appwriteConfig.databaseId,
      tableId: appwriteConfig.userTableId,
      queries: [Query.equal("accountId", acct.$id)],
    });

    const row = response.rows && response.rows.length ? response.rows[0] : null;
    return row;
  } catch (err) {
    console.error("getCurrentUser error", err);
    return null;
  }
}

export async function signOut() {
  try {
    await account.deleteSession({ sessionId: "current" });
  } catch (err) {
    const error = err instanceof Error ? err : new Error("signOut failed");
    throw error;
  }
}

export async function getAllPosts(): Promise<Post[]> {
  try {
    const response = await tablesDB.listRows({
      databaseId: appwriteConfig.databaseId,
      tableId: appwriteConfig.videoTableId,
    });
    return response.rows as unknown as Post[];
  } catch (err) {
    const error = err instanceof Error ? err : new Error("getAllPosts failed");
    throw error;
  }
}

export async function getLatestPosts() {
  try {
    const response = await tablesDB.listRows({
      databaseId: appwriteConfig.databaseId,
      tableId: appwriteConfig.videoTableId,
      queries: [Query.orderDesc("$createdAt"), Query.limit(7)],
    });
    return response.rows as unknown as Post[];
  } catch (err) {
    const error = err instanceof Error ? err : new Error("getLatestPosts failed");
    throw error;
  }
}
