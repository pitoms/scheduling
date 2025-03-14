"use server";

import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";

// Set the selected user ID in a cookie
export async function setSelectedUser(userId: string) {
  // Add await for cookies()
  const cookieStore = await cookies();
  cookieStore.set("selectedUserId", userId, {
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 30, // 30 days
  });
}

// Get the selected user ID from cookie
export async function getSelectedUser() {
  // Add await for cookies()
  const cookieStore = await cookies();
  return cookieStore.get("selectedUserId")?.value || "";
}

// Get user details from database
export async function getUserDetails(userId: string) {
  if (!userId) return null;

  // Add await for createClient()
  const supabase = await createClient();
  const { data } = await supabase
    .from("test_users")
    .select("id, email, user_type")
    .eq("id", userId)
    .single();

  return data;
}

// Get all users
export async function getAllUsers() {
  // Add await for createClient()
  const supabase = await createClient();
  const { data } = await supabase
    .from("test_users")
    .select("id, email, user_type");

  return data || [];
}
