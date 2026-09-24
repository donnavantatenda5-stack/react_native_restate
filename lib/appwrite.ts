import {
  Client,
  Account,
  Databases,
  OAuthProvider,
  Avatars,
  Query,
  Storage,
} from "react-native-appwrite";
import * as Linking from "expo-linking";
import { openAuthSessionAsync } from "expo-web-browser";

import { demoProperties } from "./fallback-data";

export interface PropertyDoc {
  $id: string;
  $createdAt: string;
  name: string;
  type: string;
  description: string;
  address: string;
  price: number;
  area: number;
  bedrooms: number;
  bathrooms: number;
  rating: number;
  facilities: string[];
  image: string;
  agent: string | Record<string, any> | null;
  reviews: string[] | Record<string, any>[];
  gallery: string[];
}

function isAuthError(error: unknown): boolean {
  const message =
    error instanceof Error ? error.message.toLowerCase() : "";
  return (
    message.includes("not authorized") ||
    message.includes("unauthorized") ||
    message.includes("missing scopes") ||
    message.includes("invalid origin") ||
    message.includes("forbidden") ||
    message.includes("access denied")
  );
}

function demoLatest() {
  return demoProperties
    .slice()
    .sort(
      (a, b) =>
        new Date(b.$createdAt).getTime() -
        new Date(a.$createdAt).getTime()
    )
    .slice(0, 5);
}

function demoFiltered(
  filter?: string,
  query?: string,
  limit?: number
) {
  let result = demoProperties.slice();

  if (filter && filter !== "All") {
    result = result.filter((item) => item.type === filter);
  }

  if (query && query.trim()) {
    const searchTerm = query.trim().toLowerCase();
    result = result.filter(
      (item) =>
        item.name.toLowerCase().includes(searchTerm) ||
        item.address.toLowerCase().includes(searchTerm) ||
        item.type.toLowerCase().includes(searchTerm)
    );
  }

  result = result.slice().sort(
    (a, b) =>
      new Date(b.$createdAt).getTime() -
      new Date(a.$createdAt).getTime()
  );

  return limit ? result.slice(0, limit) : result;
}

export const config = {
  platform: "host.exp.exponent",

  endpoint:
    process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT ?? "https://fra.cloud.appwrite.io/v1",
  projectId:
    process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID ?? "6ab124940038e1902afa",

  databaseId: process.env.EXPO_PUBLIC_APPWRITE_DATABASE_ID,

  galleriesCollectionId:
    process.env.EXPO_PUBLIC_APPWRITE_GALLERIES_COLLECTION_ID,

  reviewsCollectionId:
    process.env.EXPO_PUBLIC_APPWRITE_REVIEWS_COLLECTION_ID,

  agentsCollectionId:
    process.env.EXPO_PUBLIC_APPWRITE_AGENTS_COLLECTION_ID,

  propertiesCollectionId:
    process.env.EXPO_PUBLIC_APPWRITE_PROPERTIES_COLLECTION_ID,

  bucketId: process.env.EXPO_PUBLIC_APPWRITE_BUCKET_ID,
};

export const client = new Client();

if (config.endpoint) {
  client.setEndpoint(config.endpoint);
}

if (config.projectId) {
  client.setProject(config.projectId);
}

client.setPlatform(config.platform);

export const account = new Account(client);
export const databases = new Databases(client);
export const storage = new Storage(client);
export const avatar = new Avatars(client);

export async function login(): Promise<boolean> {
  try {
    const redirectUri = Linking.createURL("/");

    const response = await account.createOAuth2Token(
      OAuthProvider.Google,
      redirectUri
    );

    if (!response) {
      throw new Error("Failed to create Google OAuth token.");
    }

    const browserResult = await openAuthSessionAsync(
      response.toString(),
      redirectUri
    );

    if (browserResult.type !== "success") {
      throw new Error("Google authentication failed.");
    }

    const url = new URL(browserResult.url);

    const secret = url.searchParams.get("secret");
    const userId = url.searchParams.get("userId");

    if (!secret || !userId) {
      throw new Error("Missing userId or secret.");
    }

    const session = await account.createSession(userId, secret);

    if (!session) {
      throw new Error("Failed to create Appwrite session.");
    }

    return true;
  } catch (error) {
    console.error("Login error:", error);
    return false;
  }
}

export async function logout(): Promise<boolean> {
  try {
    await account.deleteSession("current");
    return true;
  } catch (error) {
    const message = error instanceof Error ? error.message.toLowerCase() : "";
    const alreadyLoggedOut =
      message.includes("missing scopes") ||
      message.includes("not authenticated") ||
      message.includes("unauthorized") ||
      message.includes("invalid origin");
    if (alreadyLoggedOut) {
      return true;
    }
    console.error("Logout error:", error);
    return false;
  }
}

export async function getCurrentUser() {
  try {
    const result = await account.get();

    if (!result.$id) {
      return null;
    }

    const userAvatar = avatar.getInitials(result.name);

    return {
      ...result,
      avatar: userAvatar.toString(),
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "";
    const notLoggedIn =
      message.includes("missing scopes") ||
      message.includes("not authenticated") ||
      message.includes("Unauthorized") ||
      message.includes("Invalid Origin");
    if (!notLoggedIn) {
      console.error("Get current user error:", error);
    }
    return null;
  }
}

export async function getLatestProperties() {
  try {
    if (!config.databaseId || !config.propertiesCollectionId) {
      return demoLatest();
    }

    const result = await databases.listDocuments(
      config.databaseId,
      config.propertiesCollectionId,
      [Query.orderDesc("$createdAt"), Query.limit(5)]
    );

    return result.documents;
  } catch (error) {
    if (!isAuthError(error)) {
      console.error("Get latest properties error:", error);
    }
    return demoLatest();
  }
}

export async function getProperties({
  filter,
  query,
  limit,
}: {
  filter?: string;
  query?: string;
  limit?: number;
}) {
  try {
    if (!config.databaseId || !config.propertiesCollectionId) {
      return demoFiltered(filter, query, limit);
    }

    const buildQuery: string[] = [
      Query.orderDesc("$createdAt"),
    ];

    if (filter && filter !== "All") {
      buildQuery.push(Query.equal("type", filter));
    }

    if (query && query.trim()) {
      const searchTerm = query.trim();

      buildQuery.push(
        Query.or([
          Query.search("name", searchTerm),
          Query.search("address", searchTerm),
          Query.search("type", searchTerm),
        ])
      );
    }

    if (limit) {
      buildQuery.push(Query.limit(limit));
    }

    const result = await databases.listDocuments(
      config.databaseId,
      config.propertiesCollectionId,
      buildQuery
    );

    return result.documents;
  } catch (error) {
    if (!isAuthError(error)) {
      console.error("Get properties error:", error);
    }
    return demoFiltered(filter, query, limit);
  }
}

export async function getPropertyById({
  id,
}: {
  id: string;
}) {
  try {
    if (!config.databaseId || !config.propertiesCollectionId) {
      return demoProperties.find((item) => item.$id === id) ?? null;
    }

    const result: Record<string, any> = await databases.getDocument(
      config.databaseId,
      config.propertiesCollectionId,
      id
    );

    const agentId = Array.isArray(result.agent)
      ? result.agent[0]
      : result.agent?.$id;
    if (agentId && config.agentsCollectionId) {
      try {
        result.agent = await databases.getDocument(
          config.databaseId,
          config.agentsCollectionId,
          agentId
        );
      } catch {
        result.agent = null;
      }
    }

    const reviewIds = Array.isArray(result.reviews) ? result.reviews : [];
    if (reviewIds.length && config.reviewsCollectionId) {
      const reviews = await Promise.all(
        reviewIds.map((reviewId: string) =>
          databases
            .getDocument(
              config.databaseId!,
              config.reviewsCollectionId!,
              reviewId
            )
            .catch(() => null)
        )
      );
      result.reviews = reviews.filter(Boolean);
    }

    return result;
  } catch (error) {
    if (!isAuthError(error)) {
      console.error("Get property by ID error:", error);
    }
    return demoProperties.find((item) => item.$id === id) ?? null;
  }
}