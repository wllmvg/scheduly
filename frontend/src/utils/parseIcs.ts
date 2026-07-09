export interface CalendarEvent {
  summary: string;
  location?: string;
  description?: string;
  start: { dateTime: string; timeZone: string };
  end: { dateTime: string; timeZone: string };
  recurrence?: string[];
}

// Bogotá no tiene horario de verano: el offset UTC-5 es fijo todo el año.
const BOGOTA_OFFSET_HOURS = 5;

export function parseIcsToEvents(icsText: string): CalendarEvent[] {
  const events: CalendarEvent[] = [];
  const blocks = icsText.split("BEGIN:VEVENT").slice(1);

  for (const block of blocks) {
    const get = (key: string): string => {
      const match = block.match(new RegExp(`${key}[^:]*:([^\r\n]+)`));
      return match ? match[1].trim() : "";
    };

    const formatDate = (raw: string): string => {
      return raw.replace(
        /(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2}).*/,
        "$1-$2-$3T$4:$5:$6"
      );
    };

    // El RRULE del .ics trae UNTIL en hora LOCAL de Bogotá, sin sufijo Z
    // (ej. "UNTIL=20261122T092000"). Como el DTSTART/DTEND que mandamos a
    // Google van con dateTime "naive" + timeZone: "America/Bogota", el
    // RRULE.UNTIL debe ir en UTC real (RFC 5545) para que Google lo acepte:
    // no basta con pegarle una "Z", hay que sumar el offset (+5h) y
    // convertir la fecha/hora correctamente (incluyendo cambio de día).
    const fixRRule = (rrule: string): string => {
      return rrule.replace(
        /UNTIL=(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})(?!Z)/,
        (_match, y: string, mo: string, d: string, h: string, mi: string, s: string) => {
          const localAsUtcMs = Date.UTC(
            Number(y),
            Number(mo) - 1,
            Number(d),
            Number(h),
            Number(mi),
            Number(s)
          );
          const realUtc = new Date(localAsUtcMs + BOGOTA_OFFSET_HOURS * 60 * 60 * 1000);

          const pad = (n: number) => String(n).padStart(2, "0");
          const yyyy = realUtc.getUTCFullYear();
          const MM = pad(realUtc.getUTCMonth() + 1);
          const DD = pad(realUtc.getUTCDate());
          const HH = pad(realUtc.getUTCHours());
          const mm = pad(realUtc.getUTCMinutes());
          const ss = pad(realUtc.getUTCSeconds());

          return `UNTIL=${yyyy}${MM}${DD}T${HH}${mm}${ss}Z`;
        }
      );
    };

    const rrule = get("RRULE");
    const summary = get("SUMMARY");

    if (!summary) continue;

    events.push({
      summary,
      location: get("LOCATION") || undefined,
      description: get("DESCRIPTION") || undefined,
      start: { dateTime: formatDate(get("DTSTART")), timeZone: "America/Bogota" },
      end:   { dateTime: formatDate(get("DTEND")),   timeZone: "America/Bogota" },
      ...(rrule ? { recurrence: [`RRULE:${fixRRule(rrule)}`] } : {}),
    });
  }

  return events;
}