import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface AuthState {
  role: string | null;
  persona: string | null;
  setRole: (r: string | null) => void;
  setPersona: (p: string | null) => void;
  reset: () => void;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [role, setRole] = useState<string | null>(null);
  const [persona, setPersona] = useState<string | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('webqx_portal_auth');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.role) setRole(parsed.role);
        if (parsed.persona) setPersona(parsed.persona);
      }
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    const payload = JSON.stringify({ role, persona });
    localStorage.setItem('webqx_portal_auth', payload);
  }, [role, persona]);

  const reset = () => { setRole(null); setPersona(null); };

  return (
    <AuthContext.Provider value={{ role, persona, setRole, setPersona, reset }}>
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
