"use client";

import { AvailabilityDates, formatDate } from "@/components/availability-dates";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import type { TimeSlot } from "@/components/availability-dates";
import { useToast } from "@/components/ui/use-toast";
import { getSelectedUser } from "@/app/actions/userActions";

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface Coach {
  email: string;
  id: string;
  user_type: "coach";
}

interface Appointment {
  id: number;
  start_time: string;
  end_time: string;
  coach_id: string;
  coach_email?: string;
}

export function StudentHome() {
  const [coaches, setCoaches] = useState<Coach[]>([]);
  const [selectedCoach, setSelectedCoach] = useState<Coach | null>(null);
  const [studentId, setStudentId] = useState<string | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [availabilityKey, setAvailabilityKey] = useState(0); // Add key for forcing refresh
  const { toast } = useToast();

  // Format time for display
  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const period = hours >= 12 ? "PM" : "AM";
    const hour12 = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
    return `${hour12}:${minutes.toString().padStart(2, "0")} ${period}`;
  };

  // Function to fetch student appointments
  const fetchStudentAppointments = async () => {
    if (!studentId) return;

    try {
      setLoading(true);
      const now = new Date();
      const weekFromNow = new Date();
      weekFromNow.setDate(weekFromNow.getDate() + 7);

      // Fetch calls booked by this student
      const { data: calls, error } = await supabase
        .from("calls")
        .select(`
          id,
          start_time,
          end_time,
          coach_id
        `)
        .eq("student_id", studentId)
        .gte("start_time", now.toISOString())
        .lt("start_time", weekFromNow.toISOString())
        .order("start_time", { ascending: true });

      if (error) {
        console.error("Error fetching student appointments:", error);
        return;
      }

      console.log("Raw student appointments data:", calls);
      
      // Fetch coach details for each call
      const appointmentsWithCoach = await Promise.all((calls || []).map(async (call) => {
        let coachEmail = "Unknown";
        
        if (call.coach_id) {
          // Fetch coach email from test_users table
          const { data: coachData, error: coachError } = await supabase
            .from("test_users")
            .select("email")
            .eq("id", call.coach_id)
            .single();
            
          if (!coachError && coachData) {
            coachEmail = coachData.email;
          } else {
            console.error("Error fetching coach:", coachError);
          }
        }
        
        return {
          id: call.id,
          start_time: call.start_time,
          end_time: call.end_time,
          coach_id: call.coach_id,
          coach_email: coachEmail
        };
      }));

      console.log("Processed student appointments:", appointmentsWithCoach);
      setAppointments(appointmentsWithCoach);
    } catch (error) {
      console.error("Error in fetchStudentAppointments:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        // Get selected user ID using the server action
        const selectedUserId = await getSelectedUser();
        console.log("Selected user ID:", selectedUserId);

        if (selectedUserId) {
          setStudentId(selectedUserId);
        }

        // Get coaches
        const { data: coachesData, error: coachError } = await supabase
          .from("test_users")
          .select()
          .eq("user_type", "coach");

        if (coachError) {
          console.error("Error fetching coaches:", coachError);
          return;
        }

        if (coachesData) {
          setCoaches(coachesData);
        }
      } catch (error) {
        console.error("Error in fetchUserData:", error);
      }
    };

    fetchUserData();
  }, []);

  useEffect(() => {
    fetchStudentAppointments();
  }, [studentId]);

  const handleScheduleAppointment = async (slots: TimeSlot[]) => {
    if (!selectedCoach || slots.length === 0 || !studentId) {
      console.log("Missing required data:", {
        hasCoach: !!selectedCoach,
        hasSlots: slots.length > 0,
        studentId,
        selectedCoach,
        slots,
      });
      toast({
        variant: "destructive",
        title: "Error",
        description: "Missing required information to book appointment.",
      });
      return;
    }

    const slot = slots[0]; // We only use the first slot since it's single mode

    try {
      console.log("Attempting to book slot:", {
        coachId: selectedCoach.id,
        startTime: new Date(slot.start).toISOString(),
        endTime: new Date(slot.end).toISOString(),
        studentId,
      });

      // First verify the slot is still available
      const { data: call, error: fetchError } = await supabase
        .from("calls")
        .select("*")
        .eq("coach_id", selectedCoach.id)
        .eq("start_time", new Date(slot.start).toISOString())
        .eq("end_time", new Date(slot.end).toISOString())
        .is("student_id", null);

      console.log("Slot verification query results:", { call, fetchError });

      if (fetchError) {
        console.error("Error fetching call:", fetchError);
        toast({
          variant: "destructive",
          title: "Error",
          description: `Failed to verify slot availability: ${fetchError.message}`,
        });
        return;
      }

      // Check if we found any matching slots
      if (!call || call.length === 0) {
        console.log("No available call found with criteria");
        toast({
          variant: "destructive",
          title: "Error",
          description: "This time slot is no longer available.",
        });
        return;
      }

      // Use the first matching call
      const matchingCall = call[0];
      console.log("Found available call:", matchingCall);

      // Update the call with student_id
      const { data: updatedCall, error: updateError } = await supabase
        .from("calls")
        .update({ student_id: studentId })
        .eq("id", matchingCall.id)
        .select()
        .single();

      if (updateError) {
        console.error("Error updating call:", updateError);
        toast({
          variant: "destructive",
          title: "Error",
          description: `Failed to book appointment: ${updateError.message}`,
        });
        return;
      }

      console.log("Successfully updated call:", updatedCall);

      toast({
        title: "Success",
        description: "Successfully booked your appointment!",
      });
      setSelectedCoach(null); // Reset selection after successful booking
      setAvailabilityKey(prev => prev + 1); // Force AvailabilityDates to remount
      
      // Refresh appointments after booking
      fetchStudentAppointments();
    } catch (error) {
      console.error("Error in handleScheduleAppointment:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "An unexpected error occurred while booking your appointment.",
      });
    }
  };

  return (
    <div className="container mx-auto max-w-4xl px-4">
      <main className="flex flex-col space-y-8 py-8">
        <section>
          <h2 className="text-2xl font-medium mb-6">Your Upcoming Appointments</h2>
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
                      <p className="text-sm font-medium">Coach</p>
                      <p className="text-sm text-muted-foreground">
                        {appointment.coach_email}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section>
          <h2 className="text-2xl font-medium mb-6">Coaches</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {coaches.map((coach) => (
              <Button
                key={coach.id}
                variant={selectedCoach?.id === coach.id ? "default" : "outline"}
                className="w-full"
                onClick={() => {
                  setSelectedCoach(coach);
                  setAvailabilityKey(prev => prev + 1); // Force AvailabilityDates to remount when coach changes
                }}
              >
                {coach.email}
              </Button>
            ))}
          </div>
        </section>

        {selectedCoach && (
          <section>
            <h2 className="text-2xl font-medium mb-6">
              Select Appointment Time
            </h2>
            <AvailabilityDates
              key={availabilityKey} // Add key to force component to remount
              mode="single"
              onSlotsSelected={handleScheduleAppointment}
              coachEmail={selectedCoach.email}
              coachId={Number(selectedCoach.id)}
              studentId={Number(studentId)}
            />
          </section>
        )}
      </main>
    </div>
  );
}
