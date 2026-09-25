import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  ReactNode,
} from "react";

import { getCurrentUser, saveUserProfile, type StoredProfile } from "./appwrite";
import { clearAvatar, loadAvatar, saveAvatar } from "./avatar-storage";
import { useAppwrite } from "./useAppwrite";

interface GlobalContextType {
  isLogged: boolean;
  user: User | null;
  loading: boolean;
  refetch: (newParams?: Record<string, string | number>) => Promise<void>;
  avatar: string;
  setAvatar: (uri: string) => Promise<void>;
  canEnter: boolean;
  guest: boolean;
  enterAsGuest: () => void;
  exitGuest: () => void;
}

interface User {
  $id: string;
  name: string;
  email: string;
  avatar: string;
  profile: StoredProfile | null;
}

const GlobalContext = createContext<GlobalContextType | undefined>(undefined);

interface GlobalProviderProps {
  children: ReactNode;
}

export const GlobalProvider = ({ children }: GlobalProviderProps) => {
  const [customAvatar, setCustomAvatar] = useState("");
  const [guest, setGuest] = useState(false);
  const activeProfileKey = useRef<string | null>(null);

  const {
    data: user,
    loading,
    refetch,
  } = useAppwrite({
    fn: getCurrentUser,
  });

  useEffect(() => {
    let active = true;
    const userId = user?.$id;
    const profileKey = userId ?? "guest";
    activeProfileKey.current = profileKey;

    if (!userId) {
      setCustomAvatar("");
      return () => {
        active = false;
      };
    }

    setCustomAvatar("");
    void loadAvatar(userId)
      .then(async (storedAvatar) => {
        const nextAvatar = storedAvatar || user.profile?.avatar || "";
        if (active) {
          setCustomAvatar(nextAvatar);
        }

        try {
          await saveUserProfile({
            userId,
            name: user.name,
            email: user.email,
            avatar: nextAvatar,
          });
        } catch {
          return;
        }
      })
      .catch(() => undefined);

    return () => {
      active = false;
    };
  }, [user?.$id, user?.name, user?.email, user?.profile?.avatar]);

  const updateAvatar = async (uri: string) => {
    const profileKey = user?.$id ?? "guest";

    try {
      let storedAvatar = "";
      if (uri) {
        storedAvatar = await saveAvatar(uri, profileKey);
      } else {
        await clearAvatar(profileKey);
      }

      if (activeProfileKey.current !== profileKey) {
        return;
      }

      setCustomAvatar(storedAvatar);

      if (user) {
        try {
          await saveUserProfile({
            userId: user.$id,
            name: user.name,
            email: user.email,
            avatar: storedAvatar,
          });
        } catch {
          return;
        }
      }
    } catch {
      if (activeProfileKey.current === profileKey) {
        setCustomAvatar("");
      }
    }
  };

  const isLogged = !!user;
  const canEnter = isLogged || guest;
  const avatar = customAvatar;

  return (
    <GlobalContext.Provider
      value={{
        isLogged,
        user,
        loading,
        refetch,
        avatar,
        setAvatar: updateAvatar,
        canEnter,
        guest,
        enterAsGuest: () => setGuest(true),
        exitGuest: () => setGuest(false),
      }}
    >
      {children}
    </GlobalContext.Provider>
  );
};

export const useGlobalContext = (): GlobalContextType => {
  const context = useContext(GlobalContext);
  if (!context)
    throw new Error("useGlobalContext must be used within a GlobalProvider");

  return context;
};

export default GlobalProvider;
