import React, { createContext, useContext, useState, ReactNode } from "react";

import { getCurrentUser } from "./appwrite";
import { useAppwrite } from "./useAppwrite";

interface GlobalContextType {
  isLogged: boolean;
  user: User | null;
  loading: boolean;
  refetch: (newParams?: Record<string, string | number>) => Promise<void>;
  avatar: string;
  setAvatar: (uri: string) => void;
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
}

const GlobalContext = createContext<GlobalContextType | undefined>(undefined);

interface GlobalProviderProps {
  children: ReactNode;
}

export const GlobalProvider = ({ children }: GlobalProviderProps) => {
  const [customAvatar, setCustomAvatar] = useState("");
  const [guest, setGuest] = useState(false);

  const {
    data: user,
    loading,
    refetch,
  } = useAppwrite({
    fn: getCurrentUser,
  });

  const isLogged = !!user;
  const canEnter = isLogged || guest;
  const avatar = customAvatar || user?.avatar || "";

  return (
    <GlobalContext.Provider
      value={{
        isLogged,
        user,
        loading,
        refetch,
        avatar,
        setAvatar: setCustomAvatar,
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