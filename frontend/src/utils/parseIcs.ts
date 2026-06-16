export interface CalendarEvent {
  summary: string;
  location?: string;
  description?: string;
  start: { dateTime: string; timeZone: string };
  end: { dateTime: string; timeZone: string };
  recurrence?: string[];
}

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

    // Agrega Z al UNTIL para que Google lo acepte como UTC
    const fixRRule = (rrule: string): string => {
      return rrule.replace(
        /UNTIL=(\d{8}T\d{6})(?!Z)/g,
        "UNTIL=$1Z"
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