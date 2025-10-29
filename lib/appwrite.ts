import {
  Account,
  Avatars,
  Client,
  ID,
  Permission,
  Query,
  Role,
  Storage,
  TablesDB,
} from "react-native-appwrite";

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
  creator: AppwriteUser;
}

export interface AppwriteFile {
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
    const posts = response.rows;
    const creatorIds = posts.map((p) => p.creator).filter(Boolean);

    if (creatorIds.length === 0) return posts as unknown as Post[];

    const creatorsResponse = await tablesDB.listRows({
      databaseId: appwriteConfig.databaseId,
      tableId: appwriteConfig.userTableId,
      queries: [Query.contains("$id", creatorIds)],
    });

    const creatorsById = Object.fromEntries(creatorsResponse.rows.map((c) => [c.$id, c]));

    // Merge creator objects into posts
    return posts.map((p) => ({
      ...p,
      creator: creatorsById[p.creator] ?? null,
    })) as unknown as Post[];
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

export async function uploadFile(file: AppwriteFile | null, type: "image" | "video") {
  if (!file) return null;

  try {
    const uploaded = await storage.createFile(appwriteConfig.bucketId, ID.unique(), file, [
      Permission.read(Role.any()),
    ]);
    const fileId = uploaded.$id;

    // Construct absolute view URL manually for consistency
    const viewUrl = `${appwriteConfig.endpoint}/storage/buckets/${appwriteConfig.bucketId}/files/${fileId}/view?project=${appwriteConfig.projectId}`;

    return viewUrl;
  } catch (err) {
    const error = err instanceof Error ? err : new Error("uploadFile failed");
    console.error("uploadFile error:", error);
    throw error;
  }
}

export async function createVideoPost(form: VideoPostForm) {
  try {
    if (!form.thumbnail || !form.video) {
      throw new Error("Both thumbnail and video are required");
    }

    const [thumbUrl, videoUrl] = await Promise.all([
      uploadFile(form.thumbnail, "image"),
      uploadFile(form.video, "video"),
    ]);

    if (!thumbUrl || !videoUrl) {
      throw new Error("File upload failed");
    }

    const user = await getCurrentUser();

    const postRow = await tablesDB.createRow({
      databaseId: appwriteConfig.databaseId,
      tableId: appwriteConfig.videoTableId,
      rowId: ID.unique(),
      data: {
        title: form.title,
        thumbnail: thumbUrl,
        video: videoUrl,
        prompt: form.prompt,
        creator: user?.$id,
      },
    });

    return postRow;
  } catch (err) {
    const error = err instanceof Error ? err : new Error("createVideoPost failed");
    throw error;
  }
}

export async function getUserPosts(userId: string) {
  try {
    const response = await tablesDB.listRows({
      databaseId: appwriteConfig.databaseId,
      tableId: appwriteConfig.videoTableId,
      queries: [Query.equal("creator", userId)],
    });
    const posts = response.rows;

    const user = await getCurrentUser();

    return posts.map((p) => ({
      ...p,
      creator: user ?? null,
    })) as unknown as Post[];
  } catch (err) {
    const error = err instanceof Error ? err : new Error("getUserPosts failed");
    throw error;
  }
}

export async function searchPosts(query: string) {
  try {
    const response = await tablesDB.listRows({
      databaseId: appwriteConfig.databaseId,
      tableId: appwriteConfig.videoTableId,
      queries: [Query.search("title", query)],
    });
    return response.rows as unknown as Post[];
  } catch (err) {
    const error = err instanceof Error ? err : new Error("searchPosts failed");
    throw error;
  }
}
