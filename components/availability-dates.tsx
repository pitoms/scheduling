"use client";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Pencil, ChevronLeft, ChevronRight } from "lucide-react";
import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { createClient } from "@supabase/supabase-js";
import { useToast } from "@/components/ui/use-toast";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export const formatDate = (date: Date): string => {
  const options: Intl.DateTimeFormatOptions = {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  };
  const formattedDate = date.toLocaleDateString("en-US", options);

  const day = date.getDate();
  const suffix =
    day === 1 || day === 21 || day === 31
      ? "st"
      : day === 2 || day === 22
        ? "nd"
        : day === 3 || day === 23
          ? "rd"
          : "th";

  return formattedDate.replace(/\d+/, `${day}${suffix}`);
};

// Type for time slot from server
export interface TimeSlot {
  start: string; // UTC string
  end: string; // UTC string
}

// For demo/placeholder until we get real slots from server
const generateDemoSlots = (date: Date): TimeSlot[] =>
  [
    "12:00 AM",
    "2:00 AM",
    "4:00 AM",
    "6:00 AM",
    "8:00 AM",
    "10:00 AM",
    "12:00 PM",
    "2:00 PM",
    "4:00 PM",
    "6:00 PM",
    "8:00 PM",
    "10:00 PM",
  ].map((time) => {
    const [hours, period] = time.split(" ");
    const [h, m] = hours.split(":");
    let date24h = parseInt(h);

    // Convert to 24-hour format
    if (period === "PM" && date24h !== 12) {
      date24h += 12;
    } else if (period === "AM" && date24h === 12) {
      date24h = 0;
    }

    const startDate = new Date(date);
    startDate.setHours(date24h, 0, 0, 0);

    const endDate = new Date(startDate);
    endDate.setHours(startDate.getHours() + 2);

    return {
      start: startDate.toISOString(),
      end: endDate.toISOString(),
    };
  });

interface AvailabilityDayProps {
  date: Date;
  mode: "single" | "multi";
  selected?: boolean;
  availableSlots?: TimeSlot[];
  selectedSlots?: TimeSlot[];
  onSelect?: (slot: TimeSlot) => void;
  coachEmail?: string;
}

export function AvailabilityDay({
  date,
  mode,
  selected,
  availableSlots = [],
  selectedSlots = [],
  onSelect,
  coachEmail,
}: AvailabilityDayProps) {
  // Convert UTC strings to local time for display
  const formatTimeSlot = (slot: TimeSlot) => {
    const start = new Date(slot.start);
    const hour = start.getHours();
    const minute = start.getMinutes();
    const period = hour >= 12 ? "PM" : "AM";
    const hour12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${hour12}:${minute.toString().padStart(2, "0")} ${period}`;
  };

  const formatDayHeader = (date: Date) => {
    const weekday = date.toLocaleDateString("en-US", { weekday: "short" });
    const month = date.getMonth() + 1;
    const day = date.getDate();
    return `${weekday} ${month}/${day}`;
  };

  // Only use demo slots in multi (coach) mode
  const slots =
    mode === "multi" && availableSlots.length === 0
      ? generateDemoSlots(date)
      : availableSlots.filter((slot) => {
          const slotDate = new Date(slot.start);
          return slotDate.toDateString() === date.toDateString();
        });

  if (mode === "single") {
    return (
      <div className="flex flex-col space-y-2">
        {date && <p className="font-medium mb-2">{formatDayHeader(date)}</p>}
        <div className="flex flex-col space-y-2">
          {slots.map((slot, index) => (
            <Dialog key={`${date.toISOString()}-${slot.start}-${index}`}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="w-full">
                  {formatTimeSlot(slot)}
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Confirm Appointment</DialogTitle>
                </DialogHeader>
                <div className="py-4">
                  <p>
                    Would you like to schedule an appointment with {coachEmail}{" "}
                    for:
                  </p>
                  <p className="font-medium mt-2">
                    {formatDayHeader(date)} at {formatTimeSlot(slot)}?
                  </p>
                </div>
                <div className="flex justify-end gap-2">
                  <DialogTrigger asChild>
                    <Button variant="outline">Cancel</Button>
                  </DialogTrigger>
                  <Button onClick={() => onSelect?.(slot)}>
                    Confirm Appointment
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          ))}
        </div>
      </div>
    );
  }

  const isSlotSelected = (slot: TimeSlot) => {
    return selectedSlots.some(
      (s: TimeSlot) => s.start === slot.start && s.end === slot.end
    );
  };

  return (
    <div className="flex flex-col space-y-2">
      {date && <p className="font-medium mb-2">{formatDayHeader(date)}</p>}
      {slots.map((slot, index) => (
        <Button
          key={`${date.toISOString()}-${slot.start}-${index}`}
          variant={isSlotSelected(slot) ? "default" : "outline"}
          size="sm"
          onClick={() => onSelect?.(slot)}
        >
          {formatTimeSlot(slot)}
        </Button>
      ))}
    </div>
  );
}

interface AvailabilityDatesProps {
  showCalendar?: boolean;
  mode?: "single" | "multi";
  availableSlots?: TimeSlot[];
  onSlotsSelected?: (slots: TimeSlot[]) => void;
  coachEmail?: string;
  coachId?: number;
  studentId?: number;
}

export function AvailabilityDates({
  showCalendar: initialShowCalendar = false,
  mode = "multi",
  availableSlots = [],
  onSlotsSelected,
  coachEmail,
  coachId,
  studentId,
}: AvailabilityDatesProps) {
  const { toast } = useToast();
  const [date, setDate] = React.useState<Date | undefined>(new Date());
  const [showCalendar, setShowCalendar] = React.useState(initialShowCalendar);
  const [selectedSlots, setSelectedSlots] = React.useState<TimeSlot[]>([]);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [existingCalls, setExistingCalls] = React.useState<TimeSlot[]>([]);
  const [availableCoachSlots, setAvailableCoachSlots] = React.useState<
    TimeSlot[]
  >([]);
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  console.log("AvailabilityDates props:", { mode, coachId, date });

  const fetchAvailableSlots = async () => {
    console.log("fetchAvailableSlots called with:", { date, coachId, mode });

    if (!date || !coachId || mode !== "single") {
      console.log("fetchAvailableSlots early return:", {
        hasDate: !!date,
        hasCoachId: !!coachId,
        isCorrectMode: mode === "single",
      });
      return;
    }

    // Calculate start and end of the week
    const weekStart = new Date(date);
    weekStart.setHours(0, 0, 0, 0);

    // Ensure we don't fetch slots before today
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Use the later of weekStart or today
    const effectiveStart = weekStart < today ? today : weekStart;

    const weekEnd = new Date(date);
    weekEnd.setDate(weekEnd.getDate() + 7);
    weekEnd.setHours(23, 59, 59, 999);

    console.log("Fetching slots for date range:", {
      weekStart: effectiveStart.toISOString(),
      weekEnd: weekEnd.toISOString(),
    });

    try {
      // Clear existing slots before fetching new ones
      setAvailableCoachSlots([]);

      const { data: calls, error } = await supabase
        .from("calls")
        .select("*")
        .eq("coach_id", coachId)
        .is("student_id", null)
        .gte("start_time", effectiveStart.toISOString())
        .lt("start_time", weekEnd.toISOString());

      if (error) {
        console.error("Error fetching available slots:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load available time slots. Please try again.",
        });
        return;
      }

      // Convert calls to TimeSlot format
      const timeSlots: TimeSlot[] = calls.map((call) => ({
        start: new Date(call.start_time).toISOString(),
        end: new Date(call.end_time).toISOString(),
      }));

      console.log("Fetched available coach slots:", timeSlots);
      setAvailableCoachSlots(timeSlots);
    } catch (error) {
      console.error("Error in fetchAvailableSlots:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "An error occurred while loading available slots.",
      });
    }
  };

  // Fetch available coach slots for students
  React.useEffect(() => {
    console.log("useEffect for fetchAvailableSlots triggered with:", {
      date,
      coachId,
      mode,
    });
    fetchAvailableSlots();
  }, [date, coachId, mode]);

  // Refetch available slots when selectedCoach changes in StudentHome
  React.useEffect(() => {
    if (mode === "single" && coachId) {
      fetchAvailableSlots();
    }
  }, [coachId]);

  // Fetch existing calls for coaches (multi mode)
  React.useEffect(() => {
    const fetchExistingCalls = async () => {
      if (!date || !coachId || mode !== "multi") return;

      // Calculate start and end of the week
      const weekStart = new Date(date);
      weekStart.setHours(0, 0, 0, 0);
      const weekEnd = new Date(date);
      weekEnd.setDate(weekEnd.getDate() + 7);
      weekEnd.setHours(23, 59, 59, 999);

      try {
        const { data: calls, error } = await supabase
          .from("calls")
          .select("*")
          .eq("coach_id", coachId)
          .gte("start_time", weekStart.toISOString())
          .lt("start_time", weekEnd.toISOString());

        if (error) {
          console.error("Error fetching calls:", error);
          return;
        }

        // Convert calls to TimeSlot format
        const timeSlots: TimeSlot[] = calls.map((call) => ({
          start: new Date(call.start_time).toISOString(),
          end: new Date(call.end_time).toISOString(),
        }));

        console.log("Fetched existing calls:", timeSlots);
        setExistingCalls(timeSlots);
        setSelectedSlots(timeSlots);
      } catch (error) {
        console.error("Error in fetchExistingCalls:", error);
      }
    };

    fetchExistingCalls();
  }, [date, coachId, mode]);

  // Pre-select 9-5 slots when in multi mode (coach) and no existing calls
  React.useEffect(() => {
    if (mode === "multi" && date && existingCalls.length === 0) {
      const newSelectedSlots: TimeSlot[] = [];

      // For each day in the week
      for (let i = 0; i < 8; i++) {
        const currentDate = new Date(date.getTime() + i * 86400000);

        // Filter demo slots for this day that fall between 9 AM and 5 PM
        generateDemoSlots(currentDate).forEach((slot: TimeSlot) => {
          const slotDate = new Date(slot.start);
          const hour = slotDate.getHours();

          // Check if the slot is between 9 AM and 5 PM
          if (hour >= 9 && hour <= 17) {
            newSelectedSlots.push(slot);
          }
        });
      }

      setSelectedSlots(newSelectedSlots);
      onSlotsSelected?.(newSelectedSlots);
    }
  }, [date, mode, onSlotsSelected, existingCalls]);

  const handleSlotSelect = async (slot: TimeSlot) => {
    if (mode === "single") {
      console.log("Single mode slot selected:", {
        slot,
        coachId,
        studentId,
      });

      if (onSlotsSelected) {
        onSlotsSelected([slot]);
      } else {
        console.error("onSlotsSelected callback is not defined");
      }
    } else {
      // Existing coach selection logic
      setSelectedSlots((prev) => {
        const exists = prev.some(
          (s) => s.start === slot.start && s.end === slot.end
        );
        const newSlots = exists
          ? prev.filter((s) => s.start !== slot.start || s.end !== slot.end)
          : [...prev, slot];
        onSlotsSelected?.(newSlots);
        return newSlots;
      });
    }
  };

  const isDateSelected = (checkDate: Date) => {
    return selectedSlots.some((slot) => {
      const slotDate = new Date(slot.start);
      return slotDate.toDateString() === checkDate.toDateString();
    });
  };

  // Group available slots by date for display
  const getAvailableSlotsForDate = (date: Date) => {
    return availableSlots.filter((slot) => {
      const slotDate = new Date(slot.start);
      return slotDate.toDateString() === date.toDateString();
    });
  };

  const handleSubmitAvailability = async () => {
    console.log("Submitting availability:", { selectedSlots, coachId });

    if (selectedSlots.length === 0 || !coachId) {
      console.log("Missing required data:", {
        hasSlots: selectedSlots.length > 0,
        coachId,
      });
      toast({
        variant: "destructive",
        title: "Error",
        description:
          "Please select availability slots and ensure you're logged in as a coach.",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      // Prepare the calls data
      const callsData = selectedSlots.map((slot) => ({
        start_time: new Date(slot.start),
        end_time: new Date(slot.end),
        coach_id: coachId,
        created_by: "test_coach@example.com",
      }));

      console.log("Inserting calls data:", callsData);

      // Insert directly into Supabase
      const { data, error } = await supabase
        .from("calls")
        .insert(callsData)
        .select();

      if (error) {
        console.error("Error inserting calls:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to save availability slots. Please try again.",
        });
        throw new Error("Failed to create availability slots");
      }

      console.log("Successfully inserted calls:", data);
      toast({
        title: "Success",
        description: `Successfully set availability for ${selectedSlots.length} time slots.`,
      });

      // Update existing calls after successful submission
      setExistingCalls(selectedSlots);
    } catch (error) {
      console.error("Error submitting availability:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper function to format time slot for display
  const formatTimeSlot = (slot: TimeSlot) => {
    const start = new Date(slot.start);
    const hour = start.getHours();
    const minute = start.getMinutes();
    const period = hour >= 12 ? "PM" : "AM";
    const hour12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${hour12}:${minute.toString().padStart(2, "0")} ${period}`;
  };

  return (
    <div className="w-full">
      <div className="flex items-center gap-2 mb-6">
        {date && (
          <div className="flex flex-row items-center">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 mr-1"
              onClick={() => {
                if (date) {
                  const prevWeek = new Date(date);
                  prevWeek.setDate(prevWeek.getDate() - 7);

                  // Don't allow navigation to dates before today
                  const today = new Date();
                  today.setHours(0, 0, 0, 0);

                  if (prevWeek >= today) {
                    setDate(prevWeek);
                  }
                }
              }}
              // Disable the button if going back would result in a date before today
              disabled={(() => {
                const prevWeek = new Date(date);
                prevWeek.setDate(prevWeek.getDate() - 7);

                const today = new Date();
                today.setHours(0, 0, 0, 0);

                return prevWeek < today;
              })()}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            <div className="flex flex-col">
              <h2 className="text-xl font-medium">
                Week of {formatDate(date)}
              </h2>
              <p className="text-sm text-muted-foreground">
                Timezone: {timezone}
              </p>
            </div>

            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 ml-1"
              onClick={() => {
                if (date) {
                  const nextWeek = new Date(date);
                  nextWeek.setDate(nextWeek.getDate() + 7);
                  setDate(nextWeek);
                }
              }}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
        <Popover open={showCalendar} onOpenChange={setShowCalendar}>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <Pencil className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={date}
              onSelect={(newDate) => {
                setDate(newDate);
                setShowCalendar(false);
              }}
              fromDate={new Date()}
            />
          </PopoverContent>
        </Popover>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-8 gap-6">
        {Array.from({ length: 8 }, (_, i) => {
          const dayDate = date && new Date(date.getTime() + i * 86400000);
          return (
            dayDate && (
              <AvailabilityDay
                key={i}
                date={dayDate}
                mode={mode}
                selected={isDateSelected(dayDate)}
                availableSlots={
                  mode === "single"
                    ? availableCoachSlots
                    : getAvailableSlotsForDate(dayDate)
                }
                selectedSlots={selectedSlots}
                onSelect={handleSlotSelect}
                coachEmail={coachEmail}
              />
            )
          );
        })}
      </div>

      {mode === "multi" && (
        <div className="flex justify-end mt-6">
          <Button
            onClick={handleSubmitAvailability}
            disabled={
              isSubmitting ||
              selectedSlots.length === 0 ||
              existingCalls.length > 0
            }
          >
            {existingCalls.length > 0
              ? "Availability Already Set"
              : isSubmitting
                ? "Submitting..."
                : "Submit Availability"}
          </Button>
        </div>
      )}
    </div>
  );
}
