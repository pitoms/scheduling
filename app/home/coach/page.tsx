import { AvailabilityDates } from "@/components/availability-dates";

export default async function CoachHome() {
  return (
    // create availability for a week
    // If existing availability in this week, show active dates in button array
    // disable submit button
    // On change date, requery availabilities in week
    <>
      <main className="flex-1 flex flex-col gap-6 px-4">
        <h2 className="font-medium text-xl mb-4">Upcoming Appointments</h2>
        <h2 className="font-medium text-xl mb-4">Create Availability</h2>
        <AvailabilityDates />
      </main>
    </>
  );
}
