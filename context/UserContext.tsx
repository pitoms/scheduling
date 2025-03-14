"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";

export type User = {
  id: string;
  email: string;
  user_type: string;
};

type UserContextType = {
  selectedUserId: string;
  setSelectedUserId: (id: string) => void;
  currentUser: User | null;
};

// Create and export the context
export const UserContext = createContext<UserContextType | undefined>(
  undefined
);

export function UserProvider({ children }: { children: ReactNode }) {
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // Load from localStorage on mount
  useEffect(() => {
    // Only run in browser environment
    if (typeof window !== "undefined") {
      const savedUserId = localStorage.getItem("selectedUserId");
      if (savedUserId) {
        setSelectedUserId(savedUserId);
      }
    }
  }, []);

  // Save to localStorage when userId changes
  useEffect(() => {
    if (typeof window !== "undefined" && selectedUserId) {
      localStorage.setItem("selectedUserId", selectedUserId);
    }
  }, [selectedUserId]);

  // Update currentUser when selectedUserId or users change
  useEffect(() => {
    if (selectedUserId && users.length > 0) {
      const user = users.find((u) => u.id === selectedUserId) || null;
      setCurrentUser(user);
    } else {
      setCurrentUser(null);
    }
  }, [selectedUserId, users]);

  return (
    <UserContext.Provider
      value={{ selectedUserId, setSelectedUserId, currentUser }}
    >
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
}
