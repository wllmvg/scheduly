import {
  createContext,
  useContext,
  useState,
} from "react";

import type { ReactNode } from "react";

interface ContextProps {
  loading: boolean;
  setLoading: (value: boolean) => void;

  downloadUrl: string;
  setDownloadUrl: (value: string) => void;
}

const SchedulyContext = createContext({} as ContextProps);

export function SchedulyProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [loading, setLoading] = useState(false);

  const [downloadUrl, setDownloadUrl] =
    useState("");

  return (
    <SchedulyContext.Provider
      value={{
        loading,
        setLoading,
        downloadUrl,
        setDownloadUrl,
      }}
    >
      {children}
    </SchedulyContext.Provider>
  );
}

export function useScheduly() {
  return useContext(SchedulyContext);
}