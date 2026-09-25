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

export interface StoredProfile {
  userId: string;
  name: string;
  email: string;
  avatar: string;
  updatedAt: string;
}

type ProfilePreferences = {
  restateProfile?: StoredProfile | null;
  [key: string]: unknown;
};

const PROFILE_PREFS_KEY = "restateProfile";

function isStoredProfile(value: unknown): value is StoredProfile {
  if (!value || typeof value !== "object") {
    return false;
  }

  const profile = value as Record<string, unknown>;
  return (
    typeof profile.userId === "string" &&
    typeof profile.name === "string" &&
    typeof profile.email === "string" &&
    typeof profile.avatar === "string" &&
    typeof profile.updatedAt === "string"
  );
}

function readStoredProfile(prefs: unknown): StoredProfile | null {
  if (!prefs || typeof prefs !== "object") {
    return null;
  }

  const profile = (prefs as Record<string, unknown>)[PROFILE_PREFS_KEY];
  return isStoredProfile(profile) ? profile : null;
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

function isNotFoundError(error: unknown): boolean {
  const message =
    error instanceof Error ? error.message.toLowerCase() : "";
  const code =
    typeof error === "object" && error !== null && "code" in error
      ? error.code
      : undefined;

  return (
    message.includes("document with the requested id") ||
    message.includes("document not found") ||
    (code === 404 &&
      (message.includes("document") || message.includes("requested id")))
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

function hasDisplayableProperty(document: Record<string, any>): boolean {
  const hasName =
    typeof document.name === "string" && document.name.trim().length > 0;
  const hasImage =
    typeof document.image === "number" ||
    (typeof document.image === "string" && document.image.trim().length > 0) ||
    (typeof document.image === "object" && document.image !== null);

  return hasName && hasImage;
}

function filterPropertyDocuments(
  documents: Record<string, any>[],
  filter?: string,
  query?: string,
  limit?: number
) {
  let result = documents;

  if (filter && filter !== "All") {
    result = result.filter((item) => item.type === filter);
  }

  if (query && query.trim()) {
    const searchTerm = query.trim().toLowerCase();
    result = result.filter((item) =>
      [item.name, item.address, item.type].some(
        (value) =>
          typeof value === "string" &&
          value.toLowerCase().includes(searchTerm)
      )
    );
  }

  return limit ? result.slice(0, limit) : result;
}

function demoFiltered(
  filter?: string,
  query?: string,
  limit?: number
) {
  const result = demoProperties
    .slice()
    .sort(
      (a, b) =>
        new Date(b.$createdAt).getTime() -
        new Date(a.$createdAt).getTime()
    );

  return filterPropertyDocuments(result, filter, query, limit);
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

function clearClientSession(): void {
  client.setSession("");

  if (typeof window === "undefined") {
    return;
  }

  try {
    const rawCookies = window.localStorage.getItem("cookieFallback");
    if (!rawCookies) {
      return;
    }

    const cookies = JSON.parse(rawCookies) as Record<string, unknown>;
    delete cookies[`a_session_${config.projectId}`];
    window.localStorage.setItem("cookieFallback", JSON.stringify(cookies));
  } catch {
    return;
  }
}

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

export async function saveUserProfile(
  profile: Omit<StoredProfile, "updatedAt">
): Promise<void> {
  const prefs = await account.getPrefs<ProfilePreferences>();
  await account.updatePrefs<ProfilePreferences>({
    prefs: {
      ...prefs,
      [PROFILE_PREFS_KEY]: {
        ...profile,
        updatedAt: new Date().toISOString(),
      },
    },
  });
}

export async function clearUserProfile(): Promise<void> {
  const prefs = await account.getPrefs<ProfilePreferences>();
  if (!(PROFILE_PREFS_KEY in prefs)) {
    return;
  }

  const nextPrefs = { ...prefs };
  delete nextPrefs[PROFILE_PREFS_KEY];
  await account.updatePrefs<ProfilePreferences>({ prefs: nextPrefs });
}

export async function logout(): Promise<boolean> {
  try {
    await clearUserProfile();
  } catch (error) {
    if (!isAuthError(error)) {
      console.error("Profile clear error:", error);
    }
  }

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

export async function updateUserName(name: string) {
  return account.updateName({ name });
}

export async function updateUserPassword(
  password: string,
  oldPassword?: string
) {
  return account.updatePassword({
    password,
    ...(oldPassword ? { oldPassword } : {}),
  });
}

export async function getCurrentUser() {
  try {
    const result = await account.get();

    if (!result.$id) {
      return null;
    }

    const userAvatar = avatar.getInitials(result.name || result.email || "U");
    const storedProfile = readStoredProfile(result.prefs);

    return {
      ...result,
      avatar: userAvatar.toString(),
      profile: storedProfile,
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

    const documents = result.documents.filter(hasDisplayableProperty);
    return documents.length > 0 ? documents.slice(0, 5) : demoLatest();
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

    const result = await databases.listDocuments(
      config.databaseId,
      config.propertiesCollectionId,
      [Query.orderDesc("$createdAt")]
    );

    const documents = result.documents.filter(hasDisplayableProperty);

    if (documents.length === 0) {
      return demoFiltered(filter, query, limit);
    }

    const hasTypeAttribute = documents.some(
      (document) => typeof document.type === "string"
    );

    if (filter && filter !== "All" && !hasTypeAttribute) {
      return demoFiltered(filter, query, limit);
    }

    return filterPropertyDocuments(documents, filter, query, limit);
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
      ? typeof result.agent[0] === "string"
        ? result.agent[0]
        : result.agent[0]?.$id
      : typeof result.agent === "string"
        ? result.agent
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

    const reviewIds = Array.isArray(result.reviews)
      ? result.reviews
          .map((review: Record<string, any>) =>
            typeof review === "string" ? review : review?.$id
          )
          .filter(Boolean)
      : [];
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
    if (!isAuthError(error) && !isNotFoundError(error)) {
      console.error("Get property by ID error:", error);
    }
    return demoProperties.find((item) => item.$id === id) ?? null;
  }
}