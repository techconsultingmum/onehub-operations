import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

type AppRole = "admin" | "manager" | "staff" | "viewer";

interface UserConfiguration {
  industry: string;
  management_type: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  role: AppRole | null;
  configuration: UserConfiguration | null;
  loading: boolean;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  saveConfiguration: (industry: string, managementType: string) => Promise<{ error: Error | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<AppRole | null>(null);
  const [configuration, setConfiguration] = useState<UserConfiguration | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        // Defer fetching additional data
        if (session?.user) {
          setTimeout(() => {
            fetchUserRole(session.user.id);
            fetchUserConfiguration(session.user.id);
          }, 0);
        } else {
          setRole(null);
          setConfiguration(null);
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchUserRole(session.user.id);
        fetchUserConfiguration(session.user.id);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserRole = async (userId: string) => {
    const { data, error } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .maybeSingle();

    if (!error && data) {
      setRole(data.role as AppRole);
    }
  };

  const fetchUserConfiguration = async (userId: string) => {
    const { data, error } = await supabase
      .from("user_configurations")
      .select("industry, management_type")
      .eq("user_id", userId)
      .maybeSingle();

    if (!error && data) {
      setConfiguration({
        industry: data.industry,
        management_type: data.management_type,
      });
    }
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          full_name: fullName,
        },
      },
    });
    
    return { error: error as Error | null };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    return { error: error as Error | null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setRole(null);
    setConfiguration(null);
  };

  const saveConfiguration = async (industry: string, managementType: string) => {
    if (!user) return { error: new Error("Not authenticated") };

    const { error } = await supabase
      .from("user_configurations")
      .upsert({
        user_id: user.id,
        industry,
        management_type: managementType,
      }, {
        onConflict: "user_id",
      });

    if (!error) {
      setConfiguration({ industry, management_type: managementType });
    }

    return { error: error as Error | null };
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        role,
        configuration,
        loading,
        signUp,
        signIn,
        signOut,
        saveConfiguration,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
