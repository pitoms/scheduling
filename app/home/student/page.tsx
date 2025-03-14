import { AvailabilityDates } from "@/components/availability-dates";
import { Button } from "@/components/ui/button";
import { createClient } from "@/utils/supabase/server";

export default async function StudentHome() {
  const supabase = await createClient();
  //   const { data: users } = await supabase.from("test_users").select();
  const { data, error } = await supabase
    .from("test_users")
    .select()
    .eq("user_type", "coach");
  //Find coach then dates

  return (
    <>
      <main className="flex-1 px-4">
        <h2 className="font-medium text-xl mb-8">Coaches</h2>
        <div className="justify-between">
          {data?.map((coach) => {
            return (
              <Button variant="outline" key={JSON.stringify(coach)}>
                {coach.email}
              </Button>
            );
          })}
        </div>
        <AvailabilityDates />
        <Button>Submit</Button>
      </main>
    </>
  );
}
