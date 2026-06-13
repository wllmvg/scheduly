import { motion } from "framer-motion";

import {
  CalendarDays,
  ShieldCheck,
  FileText,
} from "lucide-react";

const features = [
  {
    number: "01",
    icon: FileText,
    title: "Sube tu horario PDF",
    desc: "Selecciona tu horario oficial UDES en formato PDF. No necesitas editarlo ni convertirlo manualmente.",
  },
  {
    number: "02",
    icon: ShieldCheck,
    title: "Procesamiento privado",
    desc: "Tu archivo se procesa únicamente para generar el calendario. No almacenamos PDFs, horarios ni información académica.",
  },
  {
    number: "03",
    icon: CalendarDays,
    title: "Importa tu calendario",
    desc: "Obtén un archivo .ICS compatible con Google Calendar, Apple Calendar, Outlook y la mayoría de aplicaciones modernas.",
  },
];

export default function Features() {
  return (
    <>

      <main className="
        relative
        px-4
        sm:px-6
        pt-8
      ">
        {/* Background */}

        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-20 left-10 w-96 h-96 bg-blue-500/10 rounded-full blur-[120px]" />

          <div className="absolute bottom-20 right-10 w-96 h-96 bg-cyan-500/10 rounded-full blur-[120px]" />
        </div>

        <div className="max-w-6xl mx-auto relative z-10">
          <motion.div
            initial={{
              opacity: 0,
              y: 40,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            transition={{
              duration: 0.8,
            }}
            className="text-center"
          >
            <h1 className="text-5xl md:text-6xl font-black">
              ¿Cómo funciona?
            </h1>

            <p className="max-w-3xl mx-auto mt-6 text-lg text-gray-400 leading-relaxed">
              Scheduly automatiza una tarea que
              normalmente toma varios minutos.
              Convierte tu horario académico en
              un calendario listo para usar en
              segundos evitando crear eventos
              manualmente.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8 mt-10">
            {features.map((item, index) => (
              <motion.div
                key={item.title}
                initial={{
                  opacity: 0,
                  y: 40,
                }}
                whileInView={{
                  opacity: 1,
                  y: 0,
                }}
                viewport={{
                  once: true,
                }}
                transition={{
                  delay: index * 0.15,
                }}
                className="
                  relative
                  p-8
                  rounded-3xl
                  bg-white/5
                  backdrop-blur-xl
                  border
                  border-white/10
                  hover:border-blue-500/30
                  hover:-translate-y-2
                  transition-all
                "
              >
                <span className="absolute top-5 right-5 text-6xl font-black text-white/5">
                  {item.number}
                </span>

                <item.icon
                  size={42}
                  className="text-blue-500"
                />

                <h3 className="mt-6 text-xl font-bold">
                  {item.title}
                </h3>

                <p className="mt-4 text-gray-400 leading-relaxed">
                  {item.desc}
                </p>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{
              opacity: 0,
              y: 40,
            }}
            whileInView={{
              opacity: 1,
              y: 0,
            }}
            viewport={{
              once: true,
            }}
            className="
              mt-20
              rounded-3xl
              border
              border-blue-500/20
              bg-blue-500/5
              p-10
            "
          >
            <h2 className="text-3xl font-black">
              Privacidad y seguridad
            </h2>

            <p className="mt-6 text-gray-400 leading-relaxed text-lg">
              Scheduly no vende, comparte ni almacena
              tu información académica. El único
              objetivo de la plataforma es interpretar
              temporalmente el horario PDF y generar
              el archivo .ICS que posteriormente
              podrás importar en tu calendario favorito.
            </p>

            <p className="mt-4 text-gray-400 leading-relaxed text-lg">
              Actualmente el proyecto se encuentra
              optimizado para los formatos oficiales
              de la Universidad de Santander (UDES),
              aunque futuras versiones incorporarán
              soporte para otras universidades
              colombianas.
            </p>
          </motion.div>
        </div>
      </main>

    </>
  );
}