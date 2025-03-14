import { getSelectedUser, getUserDetails } from "@/app/actions/userActions";
import { CoachHome } from "@/components/coach-home";
import { StudentHome } from "@/components/student-home";

export default async function Home() {
  const selectedUserId = await getSelectedUser();
  const userDetails = selectedUserId
    ? await getUserDetails(selectedUserId)
    : null;

  if (!userDetails) {
    return (
      <div className="container mx-auto max-w-4xl px-4 py-8">
        <div className="text-center text-gray-500">
          Please select a user to continue
        </div>
      </div>
    );
  }

  return userDetails.user_type === "student" ? <StudentHome /> : <CoachHome />;
}
