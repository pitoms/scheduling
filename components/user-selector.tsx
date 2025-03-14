"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useEffect, useState } from "react";
import {
  setSelectedUser,
  getAllUsers,
  getSelectedUser,
} from "@/app/actions/userActions";
import { useRouter } from "next/navigation";

export type User = {
  id: string;
  email: string;
  user_type: string;
};

export default function UserSelector() {
  const router = useRouter();
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load all users and the currently selected user
  useEffect(() => {
    const initializeUser = async () => {
      try {
        setIsLoading(true);
        // Get all users
        const allUsers = await getAllUsers();
        setUsers(allUsers);

        // Get currently selected user from cookie
        const currentUserId = await getSelectedUser();
        if (
          currentUserId &&
          allUsers.some((user) => user.id === currentUserId)
        ) {
          setSelectedUserId(currentUserId);
        }
      } catch (error) {
        console.error("Error initializing user:", error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeUser();
  }, []);

  // Handle user selection change
  const handleUserChange = async (value: string) => {
    setSelectedUserId(value);
    await setSelectedUser(value);
    router.refresh(); // Force a refresh of the current route
  };

  return (
    <>
      <Select
        value={selectedUserId}
        onValueChange={handleUserChange}
        disabled={isLoading}
      >
        <SelectTrigger className="w-[180px] text-center">
          <SelectValue placeholder={isLoading ? "Loading..." : "Choose User"} />
        </SelectTrigger>
        <SelectContent>
          {users?.map((user) => (
            <SelectItem key={user.id} value={user.id}>
              {user.user_type} {user.email}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </>
  );
}
