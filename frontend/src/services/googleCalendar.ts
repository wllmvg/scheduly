import type { CalendarEvent } from "../utils/parseIcs";

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID as string;
const SCOPE = "https://www.googleapis.com/auth/calendar.events";

export function signInWithGoogle(): Promise<string> {
  return new Promise((resolve, reject) => {
    const google = (window as any).google;

    if (!google) {
      reject(new Error("Google Identity Services no cargó. Recarga la página."));
      return;
    }

    const client = google.accounts.oauth2.initTokenClient({
      client_id: CLIENT_ID,
      scope: SCOPE,
      callback: (response: any) => {
        if (response.error) {
          reject(new Error(response.error));
        } else {
          resolve(response.access_token);
        }
      },
    });

    client.requestAccessToken();
  });
}

export async function createCalendarEvents(
  accessToken: string,
  events: CalendarEvent[]
): Promise<{ created: number; errors: number }> {
  let created = 0;
  let errors = 0;

  for (const event of events) {
    try {
      const res = await fetch(
        "https://www.googleapis.com/calendar/v3/calendars/primary/events",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(event),
        }
      );

      const json = await res.json();

      if (res.ok) {
        created++;
      } else {
        console.error("Evento fallido:", JSON.stringify(event, null, 2));
        console.error("Respuesta Google:", JSON.stringify(json, null, 2));
        errors++;
      }
    } catch (e) {
      console.error("Error de red:", e);
      errors++;
    }
  }

  return { created, errors };
}