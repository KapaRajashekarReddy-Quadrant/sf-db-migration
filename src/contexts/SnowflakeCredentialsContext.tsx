import { createContext, useContext, useState, ReactNode } from 'react';

interface SnowflakeCredentials {
  account:   string;
  username:  string;
  password:  string;
  token:     string;        // ← now mandatory
  role?:     string;
}

interface SnowflakeCredentialsContextType {
  credentials:      SnowflakeCredentials | null;
  setCredentials:   (creds: SnowflakeCredentials) => void;
  clearCredentials: () => void;
}

const SnowflakeCredentialsContext = createContext<SnowflakeCredentialsContextType | undefined>(undefined);

export function SnowflakeCredentialsProvider({ children }: { children: ReactNode }) {
  const [credentials, setCredentials] = useState<SnowflakeCredentials | null>(null);
  const clearCredentials = () => setCredentials(null);

  return (
    <SnowflakeCredentialsContext.Provider value={{ credentials, setCredentials, clearCredentials }}>
      {children}
    </SnowflakeCredentialsContext.Provider>
  );
}

export function useSnowflakeCredentials() {
  const context = useContext(SnowflakeCredentialsContext);
  if (!context) {
    throw new Error('useSnowflakeCredentials must be used within SnowflakeCredentialsProvider');
  }
  return context;
}