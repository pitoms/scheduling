"use client";

import { AvailabilityDates, formatDate } from "@/components/availability-dates";
import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { getSelectedUser } from "@/app/actions/userActions";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface CallWithUser {
  id: number;
  start_time: string;
  end_time: string;
  student_id: string;
  test_users: {
    email: string;
  };
}

interface Appointment {
  id: number;
  start_time: string;
  end_time: string;
  student_id: string;
  student_email?: string;
}

export function CoachHome() {
  const [userId, setUserId] = useState<number | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  // Format time for display
  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const period = hours >= 12 ? "PM" : "AM";
    const hour12 = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
    return `${hour12}:${minutes.toString().padStart(2, "0")} ${period}`;
  };

  useEffect(() => {
    const getSelectedCoach = async () => {
      try {
        // Get currently selected user from cookie
        const selectedUserId = await getSelectedUser();
        console.log("Selected user ID from cookie:", selectedUserId);

        if (!selectedUserId) {
          console.log("No user ID found in cookie");
          return;
        }

        // Get the user details from test_users
        const { data: selectedUser, error } = await supabase
          .from("test_users")
          .select("*")
          .eq("id", selectedUserId)
          .eq("user_type", "coach")
          .single();

        console.log("Fetched user details:", { selectedUser, error });

        if (error) {
          console.error("Error fetching user:", error);
          return;
        }

        if (selectedUser) {
          const numericId = Number(selectedUser.id);
          console.log("Setting user ID:", numericId);
          setUserId(numericId);
        } else {
          console.log("No coach found with ID:", selectedUserId);
        }
      } catch (error) {
        console.error("Error in getSelectedCoach:", error);
      }
    };

    getSelectedCoach();
  }, []);

  // Fetch upcoming appointments
  useEffect(() => {
    const fetchAppointments = async () => {
      if (!userId) return;

      try {
        setLoading(true);
        const now = new Date();
        const weekFromNow = new Date();
        weekFromNow.setDate(weekFromNow.getDate() + 7);

        // Fetch calls with student_id (booked appointments)
        const { data: calls, error } = await supabase
          .from("calls")
          .select(
            `
            id,
            start_time,
            end_time,
            student_id
          `
          )
          .eq("coach_id", userId)
          .not("student_id", "is", null)
          .gte("start_time", now.toISOString())
          .lt("start_time", weekFromNow.toISOString())
          .order("start_time", { ascending: true });

        if (error) {
          console.error("Error fetching appointments:", error);
          return;
        }

        console.log("Raw appointments data:", calls);

        // Fetch student details for each call
        const appointmentsWithEmail = await Promise.all(
          (calls || []).map(async (call) => {
            let studentEmail = "Unknown";

            if (call.student_id) {
              // Fetch student email from test_users table
              const { data: studentData, error: studentError } = await supabase
                .from("test_users")
                .select("email")
                .eq("id", call.student_id)
                .single();

              if (!studentError && studentData) {
                studentEmail = studentData.email;
              } else {
                console.error("Error fetching student:", studentError);
              }
            }

            return {
              id: call.id,
              start_time: call.start_time,
              end_time: call.end_time,
              student_id: call.student_id,
              student_email: studentEmail,
            };
          })
        );

        console.log("Processed appointments:", appointmentsWithEmail);
        setAppointments(appointmentsWithEmail);
      } catch (error) {
        console.error("Error in fetchAppointments:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAppointments();
  }, [userId]);

  console.log("Current userId state:", userId);

  return (
    <div className="container mx-auto max-w-4xl px-4">
      <main className="flex flex-col space-y-8 py-8">
        <section>
          <h2 className="text-2xl font-medium mb-6">Upcoming Appointments</h2>
          {loading ? (
            <p className="text-muted-foreground">Loading appointments...</p>
          ) : appointments.length === 0 ? (
            <p className="text-muted-foreground">No upcoming appointments</p>
          ) : (
            <div className="space-y-4">
              {appointments.map((appointment) => (
                <div
                  key={appointment.id}
                  className="flex flex-col space-y-2 p-4 border rounded-lg"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium">
                        {formatDate(new Date(appointment.start_time))}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {formatTime(appointment.start_time)} -{" "}
                        {formatTime(appointment.end_time)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">Student</p>
                      <p className="text-sm text-muted-foreground">
                        {appointment.student_email || "Unknown"}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section>
          <h2 className="text-2xl font-medium mb-6">Create Availability</h2>
          <AvailabilityDates mode="multi" coachId={userId || undefined} />
        </section>
      </main>
    </div>
  );
}
