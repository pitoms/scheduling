import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(request: Request) {
  try {
    const { availabilitySlots, timezone, coachId } = await request.json();

    // Validate the request body
    if (
      !Array.isArray(availabilitySlots) ||
      availabilitySlots.length === 0 ||
      !coachId
    ) {
      return NextResponse.json(
        { error: "Invalid request data" },
        { status: 400 }
      );
    }

    // Prepare the calls data
    const callsData = availabilitySlots.map((slot) => ({
      start_time: new Date(slot.start),
      end_time: new Date(slot.end),
      coach_id: coachId,
      created_by: "test_coach@example.com", // Since we're using test data
    }));

    // Insert the calls into Supabase
    const { error: insertError } = await supabase
      .from("calls")
      .insert(callsData);

    if (insertError) {
      console.error("Error inserting calls:", insertError);
      return NextResponse.json(
        { error: "Failed to create availability slots" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: "Availability slots created successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error processing request:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
