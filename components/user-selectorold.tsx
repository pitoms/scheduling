"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createClient } from "@/utils/supabase/client";
import { createContext, useEffect, useState } from "react";

export type User = {
  id: any;
  email: any;
  user_type: any;
};

export default function UserSelector() {
  const [selectedUserID, setSelectedUserId] = useState<string>("");
  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    const fetchUsers = async () => {
      const supabase = await createClient();
      const { data: usersResponse } = await supabase
        .from("test_users")
        .select("id,email,user_type");
      setUsers(usersResponse || []);
    };

    fetchUsers();
  }, []);

  useEffect;

  return (
    <>
      <Select
        onValueChange={(value) => {
          setSelectedUserId(value);
        }}
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder={selectedUserID || "Choose User"} />
        </SelectTrigger>
        <SelectContent>
          {users?.map((user) => (
            <SelectItem key={JSON.stringify(user)} value={user.id}>
              {user.user_type} {user.email}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </>
  );
}
