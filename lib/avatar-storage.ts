import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";
import { File, Paths } from "expo-file-system";

const AVATAR_STORAGE_PREFIX = "restate:custom-avatar:";

function getStorageKey(userId: string): string {
  return `${AVATAR_STORAGE_PREFIX}${userId.trim() || "guest"}`;
}

function getSafeUserId(userId: string): string {
  return userId.replace(/[^a-zA-Z0-9_-]/g, "_") || "guest";
}

function isLocalFileUri(uri: string): boolean {
  return (
    uri.startsWith("file://") ||
    uri.startsWith("content://") ||
    uri.startsWith("ph://")
  );
}

export async function loadAvatar(userId: string): Promise<string> {
  try {
    return (await AsyncStorage.getItem(getStorageKey(userId))) ?? "";
  } catch {
    return "";
  }
}

export async function saveAvatar(uri: string, userId: string): Promise<string> {
  if (!uri) {
    await clearAvatar(userId);
    return "";
  }

  const storageKey = getStorageKey(userId);
  const previousUri = await AsyncStorage.getItem(storageKey);
  let storedUri = uri;

  if (Platform.OS !== "web" && isLocalFileUri(uri)) {
    const source = new File(uri);
    const extension = source.extension || ".jpg";
    const destination = new File(
      Paths.document,
      `profile-avatar-${getSafeUserId(userId)}-${Date.now()}${extension}`
    );
    source.copy(destination);
    storedUri = destination.uri;
  }

  await AsyncStorage.setItem(storageKey, storedUri);

  if (
    previousUri &&
    previousUri !== storedUri &&
    Platform.OS !== "web" &&
    previousUri.startsWith("file://")
  ) {
    try {
      const previousFile = new File(previousUri);
      if (previousFile.exists) {
        previousFile.delete();
      }
    } catch {
      return storedUri;
    }
  }

  return storedUri;
}

export async function clearAvatar(userId: string): Promise<void> {
  const storageKey = getStorageKey(userId);
  const previousUri = await AsyncStorage.getItem(storageKey);

  if (
    previousUri &&
    Platform.OS !== "web" &&
    previousUri.startsWith("file://")
  ) {
    try {
      const previousFile = new File(previousUri);
      if (previousFile.exists) {
        previousFile.delete();
      }
    } catch {
      await AsyncStorage.removeItem(storageKey);
      return;
    }
  }

  await AsyncStorage.removeItem(storageKey);
}
