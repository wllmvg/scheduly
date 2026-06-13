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
} from "lucide-react";
 
import { useScheduly } from "../context/SchedulyContext";
 
// --- Helper: detect device type ---
function getDeviceType(): "pc" | "android" | "ios" {
  const ua =
    navigator.userAgent || navigator.vendor || (window as any).opera || "";
 
  if (/android/i.test(ua)) {
    return "android";
  }
 
  if (/iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream) {
    return "ios";
  }
 
  // iPadOS 13+ reports as Mac, detect via touch points
  if (
    /Macintosh/.test(ua) &&
    navigator.maxTouchPoints &&
    navigator.maxTouchPoints > 1
  ) {
    return "ios";
  }
 
  // Generic mobile/tablet fallback
  if (/Mobi|Tablet/i.test(ua)) {
    return "android"; // closest generic mobile flow
  }
 
  return "pc";
}
 
// --- Instructions content per device ---
type Step = {
  text: string;
  link?: { href: string; label: string };
};
 
type DeviceInstructions = {
  title: string;
  steps: Step[];
  undo: {
    title: string;
    steps: Step[];
  };
};
 
const INSTRUCTIONS: Record<string, DeviceInstructions> = {
  pc: {
    title: "Instrucciones para PC",
    steps: [
      {
        text: 'Abre Google Calendar en este enlace:',
        link: {
          href: "https://calendar.google.com/calendar/u/3/r/settings/createcalendar",
          label: "Crear nuevo calendario",
        },
      },
      {
        text: 'Llena los datos del nuevo calendario y haz clic en "Crear calendario".',
      },
      {
        text: 'Ve a "Importar y exportar" → "Importar", selecciona el archivo .ICS descargado. En "Agregar al calendario" elige el calendario que acabas de crear y haz clic en "Importar".',
      },
      {
        text: "¡Listo! Tu horario ya está en Google Calendar.",
      },
    ],
    undo: {
      title: "¿Te equivocaste? Así puedes borrar el calendario",
      steps: [
        {
          text: "Ve a la configuración de calendarios:",
          link: {
            href: "https://calendar.google.com/calendar/u/1/r/settings",
            label: "Configuración de Google Calendar",
          },
        },
        {
          text: 'Baja en la lista y selecciona el calendario que importaste por error.',
        },
        {
          text: 'Desplázate hasta el final y selecciona "Eliminar calendario". Confirma haciendo clic en "Eliminar permanentemente".',
        },
        {
          text: "¡Listo! El calendario fue eliminado.",
        },
      ],
    },
  },
  android: {
    title: "Instrucciones para Android",
    steps: [
      {
        text: "Abre el archivo .ICS que descargaste (revísalo en tu carpeta de Descargas o desde la notificación de descarga).",
      },
      {
        text: 'Verifica la información de las materias y toca "Agregar todos" en la parte superior derecha.',
      },
      {
        text: "Selecciona la cuenta de correo donde quieres agregar el calendario.",
      },
      {
        text: 'Confirma tocando "Agregar todos" nuevamente.',
      },
      {
        text: "¡Listo! Tu horario ya está en tu calendario.",
      },
    ],
    undo: {
      title: "¿Te equivocaste?",
      steps: [
        {
          text: "Desde Android no es posible eliminar el calendario completo importado. Deberás hacerlo desde una computadora siguiendo las instrucciones para PC.",
        },
      ],
    },
  },
  ios: {
    title: "Instrucciones para iPhone / iPad",
    steps: [
      {
        text: "Abre el archivo .ICS descargado (puedes encontrarlo en la app Archivos, dentro de la carpeta Descargas).",
      },
      {
        text: 'Toca el archivo para que iOS lo reconozca como un evento o calendario y aparezca la vista previa "Agregar a calendario".',
      },
      {
        text: 'Revisa la información de las materias/eventos y elige el calendario en el que deseas agregarlos (puedes crear uno nuevo desde la app Calendario si lo prefieres).',
      },
      {
        text: 'Toca "Añadir" o "Listo" para confirmar la importación de todos los eventos.',
      },
      {
        text: "¡Listo! Tu horario ya está en tu calendario de iOS.",
      },
    ],
    undo: {
      title: "¿Te equivocaste?",
      steps: [
        {
          text: 'Abre la app Calendario, ve a "Calendarios" en la parte inferior.',
        },
        {
          text: "Busca el calendario donde se agregaron los eventos importados y tócalo para ver sus opciones.",
        },
        {
          text: 'Si los eventos se agregaron a un calendario nuevo, puedes eliminar ese calendario completo desde "Editar" → selecciona el calendario → "Eliminar calendario".',
        },
        {
          text: "Si se agregaron a un calendario existente, deberás eliminar los eventos manualmente uno por uno.",
        },
      ],
    },
  },
};
 
export default function Result() {
  const { downloadUrl } = useScheduly();
  const [showModal, setShowModal] = useState(false);
  const [showUndo, setShowUndo] = useState(false);
 
  if (!downloadUrl) {
    return <Navigate to="/" />;
  }
 
  const deviceType = getDeviceType();
  const instructions = INSTRUCTIONS[deviceType];
 
  const handleDownloadClick = () => {
    setShowModal(true);
  };
 
  return (
    <main
      className="
        min-h-screen
        flex
        items-center
        justify-center
        px-4
        sm:px-6
        mt-10
        relative
        overflow-hidden
      "
    >
      {/* BACKGROUND */}
 
      <div className="fixed inset-0 -z-10 pointer-events-none overflow-hidden">
        <motion.div
          animate={{
            x: [0, 40, 0],
            y: [0, 30, 0],
            scale: [1, 1.15, 1],
          }}
          transition={{
            duration: 14,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute top-20 left-10 w-96 h-96 bg-blue-500/10 rounded-full blur-[120px]"
        />
 
        <motion.div
          animate={{
            x: [0, -50, 0],
            y: [0, -40, 0],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 18,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute bottom-20 right-10 w-96 h-96 bg-cyan-500/10 rounded-full blur-[120px]"
        />
 
        <motion.div
          animate={{
            x: ["-50%", "-45%", "-50%"],
            y: ["-50%", "-55%", "-50%"],
            scale: [1, 1.1, 1],
            opacity: [0.05, 0.1, 0.05],
          }}
          transition={{
            duration: 22,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute top-1/2 left-1/2 w-[600px] h-[600px] bg-purple-500/5 rounded-full blur-[150px]"
        />
      </div>
 
      {/* CARD */}
 
      <motion.div
        initial={{
          opacity: 0,
          y: 50,
          scale: 0.97,
        }}
        animate={{
          opacity: 1,
          y: 0,
          scale: 1,
        }}
        transition={{
          duration: 0.8,
        }}
        className="
          relative
          z-10
          max-w-2xl
          w-full
        "
      >
        <div
          className="
            backdrop-blur-xl
            bg-white/5
            border
            border-white/10
            rounded-3xl
            p-6
            sm:p-8
            md:p-10
            text-center
          "
        >
          {/* SUCCESS ICON */}
 
          <motion.div
            initial={{
              scale: 0,
              rotate: -180,
            }}
            animate={{
              scale: 1,
              rotate: 0,
            }}
            transition={{
              duration: 0.8,
              type: "spring",
            }}
          >
            <motion.div
            >
              <CheckCircle2
                size={90}
                className="
                  mx-auto
                  text-green-400
                "
              />
            </motion.div>
          </motion.div>
 
          {/* TITLE */}
 
          <motion.h1
            initial={{
              opacity: 0,
              y: 20,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            transition={{
              delay: 0.2,
            }}
            className="
              mt-8
              text-3xl
              md:text-5xl
              font-black
            "
          >
            Calendario generado
          </motion.h1>
 
          {/* DESCRIPTION */}
 
          <motion.p
            initial={{
              opacity: 0,
              y: 20,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            transition={{
              delay: 0.35,
            }}
            className="
              mt-6
              text-base
              md:text-lg
              text-gray-400
              max-w-xl
              mx-auto
              leading-relaxed
            "
          >
            Tu horario fue procesado correctamente.
            El archivo ICS ya está listo para ser
            importado en Google Calendar,
            Outlook o Apple Calendar.
          </motion.p>
 
          {/* BADGE */}
 
          <motion.div
            initial={{
              opacity: 0,
              y: 20,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            transition={{
              delay: 0.5,
            }}
            className="
              mt-8
              flex
              items-center
              justify-center
              gap-3
              text-blue-400
            "
          >
            <CalendarDays size={22} />
 
            <span>
              Compatible con cualquier calendario moderno
            </span>
          </motion.div>
 
          {/* BUTTONS */}
 
          <motion.div
            initial={{
              opacity: 0,
              y: 20,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            transition={{
              delay: 0.65,
            }}
            className="
              mt-12
              flex
              flex-col
              md:flex-row
              justify-center
              gap-4
            "
          >
            <motion.a
              animate={{
                y: [0, -8, 0],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              whileHover={{
                scale: 1.04,
              }}
              whileTap={{
                scale: 0.98,
              }}
              href={downloadUrl}
              download="horario.ics"
              onClick={handleDownloadClick}
              className="
                inline-flex
                items-center
                justify-center
                gap-3
                px-8
                py-4
                rounded-2xl
                bg-gradient-to-r
                from-blue-500
                to-purple-500
                text-white
                font-semibold
                shadow-lg
                shadow-blue-500/20
              "
            >
              <Download size={22} />
              Descargar archivo .ICS
            </motion.a>
 
            <motion.div
              whileHover={{
                scale: 1.04,
              }}
              whileTap={{
                scale: 0.98,
              }}
            >
              <Link
                to="/"
                className="
                  inline-flex
                  items-center
                  justify-center
                  gap-3
                  px-8
                  py-4
                  rounded-2xl
                  border
                  border-white/10
                  bg-white/5
                  hover:bg-white/10
                  transition
                "
              >
                <ArrowLeft size={20} />
                Volver al inicio
              </Link>
            </motion.div>
          </motion.div>
 
          {/* FOOTER */}
 
          <motion.div
            initial={{
              opacity: 0,
            }}
            animate={{
              opacity: 1,
            }}
            transition={{
              delay: 0.9,
            }}
            className="
              mt-12
              pt-8
              border-t
              border-white/10
              text-sm
              text-gray-500
            "
          >
            Scheduly - UDES • Generación automática de horarios académicos
          </motion.div>
        </div>
      </motion.div>
 
      {/* INSTRUCTIONS MODAL */}
 
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="
              fixed
              inset-0
              z-50
              flex
              items-center
              justify-center
              bg-black/60
              backdrop-blur-sm
              px-4
            "
          >
            <motion.div
              initial={{ opacity: 0, y: 40, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 40, scale: 0.96 }}
              transition={{ duration: 0.3, type: "spring" }}
              className="
                relative
                w-full
                max-w-lg
                max-h-[85vh]
                overflow-y-auto
                backdrop-blur-xl
                bg-white/10
                border
                border-white/10
                rounded-3xl
                p-6
                sm:p-8
              "
            >
              {/* CLOSE BUTTON */}
              <button
                onClick={() => {
                  setShowModal(false);
                  setShowUndo(false);
                }}
                className="
                  absolute
                  top-4
                  right-4
                  text-gray-400
                  hover:text-white
                  transition
                "
                aria-label="Cerrar"
              >
                <X size={22} />
              </button>
 
              {!showUndo ? (
                <>
                  <h2 className="text-2xl font-bold mb-4 pr-8">
                    {instructions.title}
                  </h2>
 
                  <ol className="space-y-4 text-left text-gray-300 text-sm sm:text-base">
                    {instructions.steps.map((step, idx) => (
                      <li key={idx} className="flex gap-3">
                        <span
                          className="
                            flex-shrink-0
                            w-7
                            h-7
                            rounded-full
                            bg-blue-500/20
                            text-blue-400
                            flex
                            items-center
                            justify-center
                            font-semibold
                            text-sm
                          "
                        >
                          {idx + 1}
                        </span>
                        <span className="leading-relaxed">
                          {step.text}
                          {step.link && (
                            <>
                              {" "}
                              <a
                                href={step.link.href}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-400 underline hover:text-blue-300"
                              >
                                {step.link.label}
                              </a>
                            </>
                          )}
                        </span>
                      </li>
                    ))}
                  </ol>
 
                  <button
                    onClick={() => setShowUndo(true)}
                    className="
                      mt-6
                      w-full
                      inline-flex
                      items-center
                      justify-center
                      gap-2
                      text-sm
                      font-medium
                      text-gray-300
                      bg-white/5
                      hover:bg-red-500/10
                      hover:text-red-400
                      border
                      border-white/10
                      hover:border-red-400/30
                      rounded-xl
                      px-4
                      py-3
                      transition
                      cursor-pointer
                    "
                  >
                    <Trash2 size={16} />
                    ¿Te equivocaste? Aprende a borrar el calendario
                  </button>
                </>
              ) : (
                <>
                  <h2 className="text-2xl font-bold mb-4 pr-8">
                    {instructions.undo.title}
                  </h2>
 
                  <ol className="space-y-4 text-left text-gray-300 text-sm sm:text-base">
                    {instructions.undo.steps.map((step, idx) => (
                      <li key={idx} className="flex gap-3">
                        <span
                          className="
                            flex-shrink-0
                            w-7
                            h-7
                            rounded-full
                            bg-red-500/20
                            text-red-400
                            flex
                            items-center
                            justify-center
                            font-semibold
                            text-sm
                          "
                        >
                          {idx + 1}
                        </span>
                        <span className="leading-relaxed">
                          {step.text}
                          {step.link && (
                            <>
                              {" "}
                              <a
                                href={step.link.href}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-400 underline hover:text-blue-300"
                              >
                                {step.link.label}
                              </a>
                            </>
                          )}
                        </span>
                      </li>
                    ))}
                  </ol>
 
                  <button
                    onClick={() => setShowUndo(false)}
                    className="
                      mt-6
                      w-full
                      inline-flex
                      items-center
                      justify-center
                      gap-2
                      text-sm
                      font-medium
                      text-gray-300
                      bg-white/5
                      hover:bg-blue-500/10
                      hover:text-blue-400
                      border
                      border-white/10
                      hover:border-blue-400/30
                      rounded-xl
                      px-4
                      py-3
                      transition
                      cursor-pointer
                    "
                  >
                    <ArrowLeft size={16} />
                    Volver a las instrucciones
                  </button>
                </>
              )}
 
              <button
                onClick={() => {
                  setShowModal(false);
                  setShowUndo(false);
                }}
                className="
                  mt-8
                  w-full
                  inline-flex
                  items-center
                  justify-center
                  gap-2
                  px-6
                  py-3
                  rounded-2xl
                  bg-gradient-to-r
                  from-blue-500
                  to-purple-500
                  text-white
                  font-semibold
                  transition
                  hover:opacity-90
                  hover:scale-[1.02]
                  active:scale-[0.98]
                  cursor-pointer
                "
              >
                Entendido
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}