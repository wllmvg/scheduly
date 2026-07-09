import { useState } from "react";
import { Navigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

import {
  Download,
  CheckCircle2,
  CalendarDays,
  ArrowLeft,
  X,
  Trash2,
  Calendar,
  Loader2,
  ShieldAlert,
  Plus,
} from "lucide-react";

import { useScheduly } from "../context/SchedulyContext";
import { parseIcsToEvents } from "../utils/parseIcs";
import {
  signInWithGoogle,
  createCalendarEvents,
  listCalendars,
  createNewCalendar,
  type GoogleCalendarInfo,
} from "../services/googleCalendar";

type SyncStatus = "idle" | "loading" | "success" | "error";

// --- Helper: detect device type ---
function getDeviceType(): "pc" | "android" | "ios" {
  const ua = navigator.userAgent || navigator.vendor || (window as any).opera || "";
  if (/android/i.test(ua)) return "android";
  if (/iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream) return "ios";
  if (/Macintosh/.test(ua) && navigator.maxTouchPoints && navigator.maxTouchPoints > 1) return "ios";
  if (/Mobi|Tablet/i.test(ua)) return "android";
  return "pc";
}

type Step = { text: string; link?: { href: string; label: string } };
type DeviceInstructions = { title: string; steps: Step[]; undo: { title: string; steps: Step[] } };

const INSTRUCTIONS: Record<string, DeviceInstructions> = {
  pc: {
    title: "Instrucciones para PC",
    steps: [
      { text: "Abre Google Calendar en este enlace:", link: { href: "https://calendar.google.com/calendar/u/3/r/settings/createcalendar", label: "Crear nuevo calendario" } },
      { text: 'Llena los datos del nuevo calendario y haz clic en "Crear calendario".' },
      { text: 'Ve a "Importar y exportar" → "Importar", selecciona el archivo .ICS descargado. En "Agregar al calendario" elige el calendario que acabas de crear y haz clic en "Importar".' },
      { text: "¡Listo! Tu horario ya está en Google Calendar." },
    ],
    undo: {
      title: "¿Te equivocaste? Así puedes borrar el calendario",
      steps: [
        { text: "Ve a la configuración de calendarios:", link: { href: "https://calendar.google.com/calendar/u/1/r/settings", label: "Configuración de Google Calendar" } },
        { text: "Baja en la lista y selecciona el calendario que importaste por error." },
        { text: 'Desplázate hasta el final y selecciona "Eliminar calendario". Confirma haciendo clic en "Eliminar permanentemente".' },
        { text: "¡Listo! El calendario fue eliminado." },
      ],
    },
  },
  android: {
    title: "Instrucciones para Android",
    steps: [
      { text: "Abre el archivo .ICS que descargaste (revísalo en tu carpeta de Descargas o desde la notificación de descarga)." },
      { text: 'Verifica la información de las materias y toca "Agregar todos" en la parte superior derecha.' },
      { text: "Selecciona la cuenta de correo donde quieres agregar el calendario." },
      { text: 'Confirma tocando "Agregar todos" nuevamente.' },
      { text: "¡Listo! Tu horario ya está en tu calendario." },
    ],
    undo: {
      title: "¿Te equivocaste?",
      steps: [
        { text: "Desde Android no es posible eliminar el calendario completo importado. Deberás hacerlo desde una computadora siguiendo las instrucciones para PC." },
      ],
    },
  },
  ios: {
    title: "Instrucciones para iPhone / iPad",
    steps: [
      { text: "Abre el archivo .ICS descargado (puedes encontrarlo en la app Archivos, dentro de la carpeta Descargas)." },
      { text: 'Toca el archivo para que iOS lo reconozca como un evento o calendario y aparezca la vista previa "Agregar a calendario".' },
      { text: "Revisa la información de las materias/eventos y elige el calendario en el que deseas agregarlos (puedes crear uno nuevo desde la app Calendario si lo prefieres)." },
      { text: 'Toca "Añadir" o "Listo" para confirmar la importación de todos los eventos.' },
      { text: "¡Listo! Tu horario ya está en tu calendario de iOS." },
    ],
    undo: {
      title: "¿Te equivocaste?",
      steps: [
        { text: 'Abre la app Calendario, ve a "Calendarios" en la parte inferior.' },
        { text: "Busca el calendario donde se agregaron los eventos importados y tócalo para ver sus opciones." },
        { text: 'Si los eventos se agregaron a un calendario nuevo, puedes eliminar ese calendario completo desde "Editar" → selecciona el calendario → "Eliminar calendario".' },
        { text: "Si se agregaron a un calendario existente, deberás eliminar los eventos manualmente uno por uno." },
      ],
    },
  },
};

// Opción especial para representar "crear un calendario nuevo" en la lista
const NEW_CALENDAR_OPTION = "__new__";

export default function Result() {
  const { icsContent } = useScheduly();

  const [showIcsModal, setShowIcsModal]           = useState(false);
  const [showUndo, setShowUndo]                   = useState(false);
  const [showGoogleWarning, setShowGoogleWarning] = useState(false);
  const [showUndoGoogle, setShowUndoGoogle]       = useState(false);

  const [syncStatus, setSyncStatus]   = useState<SyncStatus>("idle");
  const [syncMessage, setSyncMessage] = useState("");

  // --- Estado para el selector de calendario ---
  const [showCalendarPicker, setShowCalendarPicker] = useState(false);
  const [calendarsLoading, setCalendarsLoading]      = useState(false);
  const [calendars, setCalendars]                    = useState<GoogleCalendarInfo[]>([]);
  const [selectedCalendarId, setSelectedCalendarId]  = useState<string>(NEW_CALENDAR_OPTION);
  const [newCalendarName, setNewCalendarName]        = useState("Horario UDES");
  const [pendingAccessToken, setPendingAccessToken]  = useState<string | null>(null);
  const [pickerError, setPickerError]                = useState("");

  if (!icsContent) return <Navigate to="/" />;

  const deviceType   = getDeviceType();
  const instructions = INSTRUCTIONS[deviceType];

  // Descarga el ICS
  const handleDownload = () => {
    const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href     = url;
    a.download = "horario.ics";
    a.click();
    URL.revokeObjectURL(url);
    setShowIcsModal(true);
  };

  // Paso 1: el usuario acepta la advertencia de Google -> inicia sesión y
  // carga sus calendarios para que elija dónde importar el horario.
  const handleConnectGoogle = async () => {
    setShowGoogleWarning(false);
    setPickerError("");
    try {
      setCalendarsLoading(true);
      const accessToken = await signInWithGoogle();
      setPendingAccessToken(accessToken);

      const userCalendars = await listCalendars(accessToken);
      setCalendars(userCalendars);

      const principal = userCalendars.find((c) => c.primary);
      setSelectedCalendarId(NEW_CALENDAR_OPTION);
      setShowCalendarPicker(true);

      // Solo para referencia visual, no afecta la lógica de creación:
      void principal;
    } catch (e: any) {
      setSyncStatus("error");
      setSyncMessage(e.message || "No se pudo conectar con Google. Intenta de nuevo.");
    } finally {
      setCalendarsLoading(false);
    }
  };

  // Paso 2: el usuario confirma el calendario elegido -> se crean los eventos ahí.
  const handleConfirmCalendarAndSync = async () => {
    if (!pendingAccessToken) return;

    try {
      setPickerError("");
      setSyncStatus("loading");
      setSyncMessage("");

      let calendarId = selectedCalendarId;

      if (selectedCalendarId === NEW_CALENDAR_OPTION) {
        const nombre = newCalendarName.trim() || "Horario UDES";
        calendarId = await createNewCalendar(pendingAccessToken, nombre);
      }

      const events = parseIcsToEvents(icsContent);
      if (events.length === 0) throw new Error("No se encontraron eventos en el horario.");

      const { created, errors } = await createCalendarEvents(pendingAccessToken, events, calendarId);
      if (created === 0) throw new Error("No se pudo crear ningún evento. Intenta de nuevo.");

      setSyncStatus("success");
      setSyncMessage(
        errors > 0
          ? `${created} eventos agregados (${errors} con error).`
          : `${created} eventos agregados correctamente.`
      );
      setShowCalendarPicker(false);
    } catch (e: any) {
      setSyncStatus("error");
      setPickerError(e.message || "Error desconocido. Intenta de nuevo.");
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center px-4 sm:px-6 mt-10 relative overflow-hidden">

      {/* BACKGROUND */}
      <div className="fixed inset-0 -z-10 pointer-events-none overflow-hidden">
        <motion.div animate={{ x: [0,40,0], y: [0,30,0], scale: [1,1.15,1] }} transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }} className="absolute top-20 left-10 w-96 h-96 bg-blue-500/10 rounded-full blur-[120px]" />
        <motion.div animate={{ x: [0,-50,0], y: [0,-40,0], scale: [1,1.2,1] }} transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }} className="absolute bottom-20 right-10 w-96 h-96 bg-cyan-500/10 rounded-full blur-[120px]" />
        <motion.div animate={{ x:["-50%","-45%","-50%"], y:["-50%","-55%","-50%"], scale:[1,1.1,1], opacity:[0.05,0.1,0.05] }} transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }} className="absolute top-1/2 left-1/2 w-[600px] h-[600px] bg-purple-500/5 rounded-full blur-[150px]" />
      </div>

      {/* CARD */}
      <motion.div initial={{ opacity: 0, y: 50, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.8 }} className="relative z-10 max-w-2xl w-full">
        <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-3xl p-6 sm:p-8 md:p-10 text-center">

          <motion.div initial={{ scale: 0, rotate: -180 }} animate={{ scale: 1, rotate: 0 }} transition={{ duration: 0.8, type: "spring" }}>
            <CheckCircle2 size={90} className="mx-auto text-green-400" />
          </motion.div>

          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="mt-8 text-3xl md:text-5xl font-black">
            Calendario generado
          </motion.h1>

          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} className="mt-6 text-base md:text-lg text-gray-400 max-w-xl mx-auto leading-relaxed">
            Tu horario fue procesado correctamente. Agrégalo directo a Google Calendar o descarga el archivo para importarlo manualmente.
          </motion.p>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="mt-8 flex items-center justify-center gap-3 text-blue-400">
            <CalendarDays size={22} />
            <span>Compatible con Google Calendar, Outlook y Apple Calendar</span>
          </motion.div>

          {/* BUTTONS */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.65 }} className="mt-12 grid grid-cols-1 sm:grid-cols-2 gap-3">

            {/* GOOGLE CALENDAR */}
            <button
              onClick={() => syncStatus !== "success" && setShowGoogleWarning(true)}
              disabled={syncStatus === "loading" || calendarsLoading}
              className={`
                cursor-pointer w-full inline-flex items-center justify-center gap-3
                px-6 py-4 rounded-2xl font-semibold transition
                disabled:opacity-70 disabled:cursor-not-allowed
                ${syncStatus === "success"
                  ? "bg-green-500/20 border border-green-500/30 text-green-400 cursor-default"
                  : syncStatus === "error"
                  ? "bg-red-500/20 border border-red-500/30 text-red-400 hover:bg-red-500/30"
                  : "bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg shadow-blue-500/20 hover:opacity-90"
                }
              `}
            >
              {(syncStatus === "loading" || calendarsLoading) && <Loader2 size={20} className="animate-spin shrink-0" />}
              {syncStatus === "idle" && !calendarsLoading && <Calendar size={20} className="shrink-0" />}
              {syncStatus === "success" && <CheckCircle2 size={20} className="shrink-0" />}
              {syncStatus === "error" && !calendarsLoading && <Calendar size={20} className="shrink-0" />}
              <span>
                {calendarsLoading && "Conectando..."}
                {!calendarsLoading && syncStatus === "loading" && "Agregando..."}
                {!calendarsLoading && syncStatus === "idle" && "Agregar a Google Calendar"}
                {!calendarsLoading && syncStatus === "success" && "¡Agregado!"}
                {!calendarsLoading && syncStatus === "error" && "Reintentar"}
              </span>
            </button>

            {/* DOWNLOAD ICS */}
            <button
              onClick={handleDownload}
              className="cursor-pointer w-full inline-flex items-center justify-center gap-3 px-6 py-4 rounded-2xl font-semibold transition border border-white/10 bg-white/5 hover:bg-white/10 text-white"
            >
              <Download size={20} className="shrink-0" />
              <span>Descargar archivo .ICS</span>
            </button>

            {/* BACK */}
            <Link to="/" className="cursor-pointer sm:col-span-2 w-full inline-flex items-center justify-center gap-3 px-6 py-3 rounded-2xl transition border border-white/10 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white text-sm">
              <ArrowLeft size={18} className="shrink-0" />
              <span>Volver al inicio</span>
            </Link>
          </motion.div>

          {/* SYNC MESSAGE */}
          <AnimatePresence>
            {syncMessage && (
              <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className={`mt-4 text-sm ${syncStatus === "success" ? "text-green-400" : "text-red-400"}`}>
                {syncMessage}
              </motion.p>
            )}
          </AnimatePresence>

          {/* UNDO GOOGLE */}
          {syncStatus === "success" && (
            <motion.button initial={{ opacity: 0 }} animate={{ opacity: 1 }} onClick={() => setShowUndoGoogle(true)} className="cursor-pointer mt-4 inline-flex items-center gap-2 text-sm text-gray-500 hover:text-red-400 transition">
              <Trash2 size={14} />
              ¿Te equivocaste? Aprende a borrar el calendario
            </motion.button>
          )}

          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.9 }} className="mt-12 pt-8 border-t border-white/10 text-sm text-gray-500">
            Scheduly - UDES • Generación automática de horarios académicos
          </motion.div>
        </div>
      </motion.div>

      {/* ── MODAL: AVISO GOOGLE NO VERIFICADO ── */}
      <AnimatePresence>
        {showGoogleWarning && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
            <motion.div initial={{ opacity: 0, y: 40, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 40, scale: 0.96 }} transition={{ duration: 0.3, type: "spring" }} className="relative w-full max-w-lg max-h-[85vh] overflow-y-auto backdrop-blur-xl bg-white/10 border border-white/10 rounded-3xl p-6 sm:p-8">

              <button onClick={() => setShowGoogleWarning(false)} className="cursor-pointer absolute top-4 right-4 text-gray-400 hover:text-white transition">
                <X size={22} />
              </button>

              <div className="flex items-center gap-3 mb-4">
                <ShieldAlert size={28} className="text-yellow-400 shrink-0" />
                <h2 className="text-xl font-bold pr-8">Antes de continuar</h2>
              </div>

              <p className="text-gray-300 text-sm leading-relaxed mb-5">
                Google mostrará una advertencia porque <strong className="text-white">Scheduly es un proyecto universitario pequeño</strong> y no ha pasado el proceso de verificación oficial de Google (que puede tardar semanas). Esto es completamente normal en apps en desarrollo.
              </p>

              <p className="text-gray-400 text-sm font-semibold mb-3">Sigue estos pasos cuando aparezca la pantalla de Google:</p>

              <ol className="space-y-4 text-gray-300 text-sm mb-6">
                {[
                  {
                    num: 1,
                    text: 'Verás el mensaje "Google no ha verificado esta aplicación". Haz clic en',
                    highlight: '"Configuración avanzada"',
                    desc: "(está abajo del todo, en letra pequeña).",
                  },
                  {
                    num: 2,
                    text: "Aparecerá el enlace (abajo del todo)",
                    highlight: '"Ir a Scheduly - William Vega (no seguro)"',
                    desc: ". Haz clic ahí para continuar.",
                  },
                  {
                    num: 3,
                    text: "Google te mostrará los permisos que solicita Scheduly:",
                    highlight: '"Ver, editar, compartir y eliminar permanentemente todos los calendarios a los que puedas acceder mediante Google Calendar"',
                    desc: ". Haz clic en Continuar para aceptar (esto es necesario para poder mostrarte tu lista de calendarios y dejarte elegir dónde importar el horario).",
                  },
                  {
                    num: 4,
                    text: "Recibirás un correo de alerta de seguridad de Google. Es",
                    highlight: "completamente normal",
                    desc: "— Google envía ese correo siempre que una app nueva accede a tu cuenta. No significa que haya pasado nada malo, ni que vayamos a hacer algo indebido con tus datos.",
                  },
                ].map((s) => (
                  <li key={s.num} className="flex gap-3">
                    <span className="flex-shrink-0 w-7 h-7 rounded-full bg-yellow-500/20 text-yellow-400 flex items-center justify-center font-semibold text-sm">
                      {s.num}
                    </span>
                    <span className="leading-relaxed">
                      {s.text} <strong className="text-white">{s.highlight}</strong> {s.desc}
                    </span>
                  </li>
                ))}
              </ol>

              <p className="text-gray-500 text-xs mb-6 leading-relaxed">
                Después de conectar, te dejaremos elegir a qué calendario quieres importar tu horario (o crear uno nuevo), para no tocar tu calendario principal por accidente.
              </p>

              <button
                onClick={handleConnectGoogle}
                className="cursor-pointer w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold hover:opacity-90 transition"
              >
                <Calendar size={18} />
                Entendido, conectar con Google
              </button>

              <div className="mt-4 pt-4 border-t border-white/10">
                <p className="text-gray-500 text-xs text-center mb-3">
                  ¿La advertencia de Google te genera desconfianza? No hay problema, puedes importarlo manualmente.
                </p>
                <button
                  onClick={() => {
                    setShowGoogleWarning(false);
                    handleDownload();
                  }}
                  className="cursor-pointer w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 text-gray-300 text-sm font-medium transition"
                >
                  <Download size={16} />
                  Mejor descargo el archivo .ICS
                </button>
              </div>

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── MODAL: SELECCIONAR CALENDARIO DESTINO ── */}
      <AnimatePresence>
        {showCalendarPicker && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
            <motion.div initial={{ opacity: 0, y: 40, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 40, scale: 0.96 }} transition={{ duration: 0.3, type: "spring" }} className="relative w-full max-w-lg max-h-[85vh] overflow-y-auto backdrop-blur-xl bg-white/10 border border-white/10 rounded-3xl p-6 sm:p-8">

              <button
                onClick={() => {
                  setShowCalendarPicker(false);
                  if (syncStatus === "loading") setSyncStatus("idle");
                }}
                className="cursor-pointer absolute top-4 right-4 text-gray-400 hover:text-white transition"
              >
                <X size={22} />
              </button>

              <div className="flex items-center gap-3 mb-2">
                <Calendar size={26} className="text-blue-400 shrink-0" />
                <h2 className="text-xl font-bold pr-8">¿A qué calendario lo importamos?</h2>
              </div>

              <p className="text-gray-400 text-sm mb-6 leading-relaxed">
                Elige un calendario existente o crea uno nuevo para no mezclar el horario con tus demás eventos.
              </p>

              <div className="space-y-2 mb-4 max-h-[40vh] overflow-y-auto pr-1">
                {/* Opción: crear calendario nuevo */}
                <label
                  className={`
                    flex items-center gap-3 p-4 rounded-2xl border cursor-pointer transition
                    ${selectedCalendarId === NEW_CALENDAR_OPTION
                      ? "border-blue-400/50 bg-blue-500/10"
                      : "border-white/10 bg-white/5 hover:bg-white/10"}
                  `}
                >
                  <input
                    type="radio"
                    name="calendar"
                    className="accent-blue-500 shrink-0"
                    checked={selectedCalendarId === NEW_CALENDAR_OPTION}
                    onChange={() => setSelectedCalendarId(NEW_CALENDAR_OPTION)}
                  />
                  <Plus size={18} className="text-blue-400 shrink-0" />
                  <div className="flex-1 text-left">
                    <p className="font-medium text-sm">Crear un calendario nuevo</p>
                    {selectedCalendarId === NEW_CALENDAR_OPTION && (
                      <input
                        type="text"
                        value={newCalendarName}
                        onChange={(e) => setNewCalendarName(e.target.value)}
                        placeholder="Nombre del calendario"
                        className="mt-2 w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-blue-400/50"
                        onClick={(e) => e.stopPropagation()}
                      />
                    )}
                  </div>
                </label>

                {/* Calendarios existentes */}
                {calendars.map((cal) => (
                  <label
                    key={cal.id}
                    className={`
                      flex items-center gap-3 p-4 rounded-2xl border cursor-pointer transition
                      ${selectedCalendarId === cal.id
                        ? "border-blue-400/50 bg-blue-500/10"
                        : "border-white/10 bg-white/5 hover:bg-white/10"}
                    `}
                  >
                    <input
                      type="radio"
                      name="calendar"
                      className="accent-blue-500 shrink-0"
                      checked={selectedCalendarId === cal.id}
                      onChange={() => setSelectedCalendarId(cal.id)}
                    />
                    <span
                      className="w-3 h-3 rounded-full shrink-0"
                      style={{ backgroundColor: cal.backgroundColor || "#3b82f6" }}
                    />
                    <span className="flex-1 text-left text-sm truncate">
                      {cal.name}
                      {cal.primary && <span className="text-gray-500"> (principal)</span>}
                    </span>
                  </label>
                ))}
              </div>

              {pickerError && (
                <p className="text-red-400 text-sm mb-4">{pickerError}</p>
              )}

              <button
                onClick={handleConfirmCalendarAndSync}
                disabled={syncStatus === "loading"}
                className="cursor-pointer w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold hover:opacity-90 transition disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {syncStatus === "loading" ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Agregando eventos...
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={18} />
                    Confirmar e importar aquí
                  </>
                )}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── MODAL: INSTRUCCIONES ICS ── */}
      <AnimatePresence>
        {showIcsModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
            <motion.div initial={{ opacity: 0, y: 40, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 40, scale: 0.96 }} transition={{ duration: 0.3, type: "spring" }} className="relative w-full max-w-lg max-h-[85vh] overflow-y-auto backdrop-blur-xl bg-white/10 border border-white/10 rounded-3xl p-6 sm:p-8">

              <button onClick={() => { setShowIcsModal(false); setShowUndo(false); }} className="cursor-pointer absolute top-4 right-4 text-gray-400 hover:text-white transition" aria-label="Cerrar">
                <X size={22} />
              </button>

              {!showUndo ? (
                <>
                  <h2 className="text-2xl font-bold mb-4 pr-8">{instructions.title}</h2>
                  <ol className="space-y-4 text-left text-gray-300 text-sm sm:text-base">
                    {instructions.steps.map((step, idx) => (
                      <li key={idx} className="flex gap-3">
                        <span className="flex-shrink-0 w-7 h-7 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center font-semibold text-sm">{idx + 1}</span>
                        <span className="leading-relaxed">
                          {step.text}
                          {step.link && <> <a href={step.link.href} target="_blank" rel="noopener noreferrer" className="text-blue-400 underline hover:text-blue-300">{step.link.label}</a></>}
                        </span>
                      </li>
                    ))}
                  </ol>
                  <button onClick={() => setShowUndo(true)} className="cursor-pointer mt-6 w-full inline-flex items-center justify-center gap-2 text-sm font-medium text-gray-300 bg-white/5 hover:bg-red-500/10 hover:text-red-400 border border-white/10 hover:border-red-400/30 rounded-xl px-4 py-3 transition">
                    <Trash2 size={16} />
                    ¿Te equivocaste? Aprende a borrar el calendario
                  </button>
                </>
              ) : (
                <>
                  <h2 className="text-2xl font-bold mb-4 pr-8">{instructions.undo.title}</h2>
                  <ol className="space-y-4 text-left text-gray-300 text-sm sm:text-base">
                    {instructions.undo.steps.map((step, idx) => (
                      <li key={idx} className="flex gap-3">
                        <span className="flex-shrink-0 w-7 h-7 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center font-semibold text-sm">{idx + 1}</span>
                        <span className="leading-relaxed">
                          {step.text}
                          {step.link && <> <a href={step.link.href} target="_blank" rel="noopener noreferrer" className="text-blue-400 underline hover:text-blue-300">{step.link.label}</a></>}
                        </span>
                      </li>
                    ))}
                  </ol>
                  <button onClick={() => setShowUndo(false)} className="cursor-pointer mt-6 w-full inline-flex items-center justify-center gap-2 text-sm font-medium text-gray-300 bg-white/5 hover:bg-blue-500/10 hover:text-blue-400 border border-white/10 hover:border-blue-400/30 rounded-xl px-4 py-3 transition">
                    <ArrowLeft size={16} />
                    Volver a las instrucciones
                  </button>
                </>
              )}

              <button onClick={() => { setShowIcsModal(false); setShowUndo(false); }} className="cursor-pointer mt-8 w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold hover:opacity-90 transition">
                Entendido
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── MODAL: DESHACER GOOGLE ── */}
      <AnimatePresence>
        {showUndoGoogle && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
            <motion.div initial={{ opacity: 0, y: 40, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 40, scale: 0.96 }} transition={{ duration: 0.3, type: "spring" }} className="relative w-full max-w-lg backdrop-blur-xl bg-white/10 border border-white/10 rounded-3xl p-6 sm:p-8">

              <button onClick={() => setShowUndoGoogle(false)} className="cursor-pointer absolute top-4 right-4 text-gray-400 hover:text-white transition">
                <X size={22} />
              </button>

              <h2 className="text-2xl font-bold mb-4 pr-8">¿Cómo borrar el calendario?</h2>

              <ol className="space-y-4 text-left text-gray-300 text-sm sm:text-base">
                {[
                  { text: "Ve a la configuración de Google Calendar:", link: { href: "https://calendar.google.com/calendar/r/settings", label: "Abrir configuración" } },
                  { text: "En la lista lateral, busca el calendario donde se agregaron los eventos." },
                  { text: 'Haz clic en los tres puntos junto al nombre → "Eliminar".' },
                  { text: 'Confirma haciendo clic en "Eliminar permanentemente".' },
                ].map((step, idx) => (
                  <li key={idx} className="flex gap-3">
                    <span className="flex-shrink-0 w-7 h-7 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center font-semibold text-sm">{idx + 1}</span>
                    <span className="leading-relaxed">
                      {step.text}
                      {step.link && <> <a href={step.link.href} target="_blank" rel="noopener noreferrer" className="text-blue-400 underline hover:text-blue-300">{step.link.label}</a></>}
                    </span>
                  </li>
                ))}
              </ol>

              <button onClick={() => setShowUndoGoogle(false)} className="cursor-pointer mt-8 w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold hover:opacity-90 transition">
                Entendido
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </main>
  );
}