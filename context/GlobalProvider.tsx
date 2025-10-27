import React, {
  createContext,
  Dispatch,
  ReactNode,
  SetStateAction,
  useContext,
  useEffect,
  useState,
} from "react";
import { AppwriteUser, getCurrentUser } from "../lib/appwrite";

interface GlobalContextType {
  isLogged: boolean;
  setIsLogged: Dispatch<SetStateAction<boolean>>;
  user: AppwriteUser | null;
  setUser: Dispatch<SetStateAction<AppwriteUser | null>>;
  loading: boolean;
}

interface GlobalProviderProps {
  children: ReactNode;
}

const GlobalContext = createContext<GlobalContextType | undefined>(undefined);

const GlobalProvider: React.FC<GlobalProviderProps> = ({ children }) => {
  const [isLogged, setIsLogged] = useState(false);
  const [user, setUser] = useState<AppwriteUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await getCurrentUser();
        if (res && res.$id && res.email) {
          setIsLogged(true);
          setUser({
            accountId: res.accountId ?? res.$id,
            id: res.$id,
            email: res.email,
            username: res.username,
            avatar: res.avatar,
            ...res,
          });
        } else {
          setIsLogged(false);
          setUser(null);
        }
      } catch (error) {
        console.error("Error fetching current user:", error);
        setIsLogged(false);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  const value: GlobalContextType = {
    isLogged,
    setIsLogged,
    user,
    setUser,
    loading,
  };

  return <GlobalContext.Provider value={value}>{children}</GlobalContext.Provider>;
};

export default GlobalProvider;

export const useGlobalContext = (): GlobalContextType => {
  const context = useContext(GlobalContext);
  if (!context) {
    throw new Error("useGlobalContext must be used within a GlobalProvider");
  }
  return context;
};
