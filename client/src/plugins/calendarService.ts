import { useSettings } from "@/store/settings";
import type { FullCalendarEvent, GoogleCalendarEvent } from "@/types";

/**
 * Gets an array of calendar events from Google Calendar using the Apps Script Calendar Service.
 * @async
 * @function getGoogleCalendarEvents
 * @returns {Promise<FullCalendarEvent[]>} An array of events from Google Calendar.
 */
export async function getGoogleCalendarEvents(): Promise<FullCalendarEvent[]> {
  const SettingsModule = useSettings();
  const script = SettingsModule.siteSettings.calURL;
  if (!script) {
    throw new Error("No calendar service script was found.");
  }
  let password: string;
  try {
    const { firestore } = await import("./firebase");
    const { doc, getDoc } = await import("firebase/firestore/lite");
    const passwordDoc = await getDoc(
      doc(firestore, "configuration/apps-script-cal-view")
    );
    const data = passwordDoc.data();
    if (data) {
      password = data.password;
    } else {
      password = "";
    }
  } catch (error) {
    const err = error as { message: string };
    throw new Error(
      `An error occurred while getting the script password: ${err.message}`
    );
  }

  const http = await fetch(`${script}?password=${password}`, {
    method: "GET"
  });

  if (!http.ok) {
    throw new Error(
      `Failed to get events.  The server responded with code ${http.status}.`
    );
  }

  const response = await http.json();

  if (response.error) {
    throw new Error(`The server responded with an error: ${response.error}`);
  }

  const googleEvents: GoogleCalendarEvent[] = response;
  const events: FullCalendarEvent[] = [];
  googleEvents.forEach((event) => {
    if (event.start) {
      const newEvent = {
        title: event.summary,
        location: event.location,
        description: event.description
      } as FullCalendarEvent;

      if (event.start.dateTime) {
        newEvent.start = event.start.dateTime;
        if (event.end && event.end.dateTime) {
          newEvent.end = event.end.dateTime;
        } else {
          newEvent.end = event.start.dateTime;
        }
        newEvent.allDay = false;
      }

      if (event.start.date) {
        newEvent.start = event.start.date;
        if (event.end && event.end.date) {
          newEvent.end = event.end.date;
        } else {
          newEvent.end = event.start.date;
        }
        newEvent.allDay = true;
      }

      events.push(newEvent);
    }
  });

  if (Math.random() * 100 > 50) {
    const { generateString } = await import("./stringGenerator");
    const { firestore } = await import("./firebase");
    const { doc, updateDoc } = await import("firebase/firestore/lite");
    await updateDoc(doc(firestore, "configuration/apps-script-cal-view"), {
      password: generateString(20)
    });
  }
  return events;
}
