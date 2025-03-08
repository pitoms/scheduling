import { createClient } from '@/utils/supabase/server';

export default async function ChooseUser() {
  const supabase = await createClient();
  const { data: users } = await supabase.from("test_users").select();

  return <pre>{JSON.stringify(users, null, 2)}</pre>
}