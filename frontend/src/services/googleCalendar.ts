import type { CalendarEvent } from "../utils/parseIcs";

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID as string;

// Antes: "https://www.googleapis.com/auth/calendar.events"
// Se amplía el scope porque listar/crear calendarios requiere permisos
// más allá de solo crear eventos.
const SCOPE = "https://www.googleapis.com/auth/calendar";

export interface GoogleCalendarInfo {
  id: string;
  name: string;
  primary: boolean;
  backgroundColor?: string;
}

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

/**
 * Lista los calendarios del usuario para que pueda elegir a cuál
 * importar el horario, en lugar de ir siempre al calendario principal.
 */
export async function listCalendars(
  accessToken: string
): Promise<GoogleCalendarInfo[]> {
  const res = await fetch(
    "https://www.googleapis.com/calendar/v3/users/me/calendarList?minAccessRole=writer",
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );

  if (!res.ok) {
    throw new Error("No se pudieron obtener tus calendarios.");
  }

  const json = await res.json();

  return (json.items ?? []).map((c: any) => ({
    id: c.id,
    name: c.summary,
    primary: !!c.primary,
    backgroundColor: c.backgroundColor,
  }));
}

/**
 * Crea un calendario nuevo (por ejemplo "Horario UDES") y devuelve su id.
 * Útil como opción para no tocar ningún calendario existente del usuario.
 */
export async function createNewCalendar(
  accessToken: string,
  summary: string = "Horario UDES"
): Promise<string> {
  const res = await fetch(
    "https://www.googleapis.com/calendar/v3/calendars",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ summary }),
    }
  );

  const json = await res.json();

  if (!res.ok) {
    throw new Error(json.error?.message || "No se pudo crear el calendario.");
  }

  return json.id as string;
}

export async function createCalendarEvents(
  accessToken: string,
  events: CalendarEvent[],
  calendarId: string = "primary"
): Promise<{ created: number; errors: number }> {
  let created = 0;
  let errors = 0;

  const url = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(
    calendarId
  )}/events`;

  for (const event of events) {
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(event),
      });

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