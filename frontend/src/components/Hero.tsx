import { motion } from "framer-motion";
import UploadZone from "../components/UploadZone";

const fadeUp = {
  hidden: {
    opacity: 0,
    y: 40,
  },
  show: {
    opacity: 1,
    y: 0,
  },
};

export default function Hero() {
  return (
    <section
      className="
        relative
        px-4
        sm:px-6
        pt-8
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

      {/* CONTENT */}

      <div className="relative z-10 w-full max-w-6xl mx-auto">
        <motion.div
          initial="hidden"
          animate="show"
          transition={{
            staggerChildren: 0.05,
          }}
          className="text-center"
        >
          {/* TITLE */}

          <motion.div
            variants={fadeUp}
            transition={{
              duration: 0.35,
            }}
          >
            <h1 className="font-black leading-[1.1]">
              <span
                className="
                  block
                  text-3xl
                  sm:text-4xl
                  md:text-6xl
                  lg:text-7xl
                "
              >
                Convierte tu horario PDF en
              </span>

              <span
                className="
                  block
                  mt-2
                  pb-2
                  text-3xl
                  sm:text-4xl
                  md:text-6xl
                  lg:text-7xl
                  text-cyan-400
                "
              >
                tu calendario digital
              </span>
            </h1>
          </motion.div>

          {/* DESCRIPTION */}

          <motion.p
            variants={fadeUp}
            className="
              max-w-3xl
              mx-auto
              mt-5
              sm:mt-6
              px-2
              text-sm
              sm:text-base
              md:text-lg
              text-gray-400
              leading-relaxed
            "
          >
            Sube tu horario oficial UDES y transforma
            tu PDF académico en un calendario totalmente
            organizado y compatible con Google Calendar,
            Outlook y Apple Calendar.

            <span className="block mt-4 text-cyan-400 font-medium">
              Cada evento incluye un recordatorio
              automático 30 minutos antes del inicio
              de la clase para ayudarte a mantener tu
              organización durante todo el semestre.
            </span>
          </motion.p>
        </motion.div>

        {/* UPLOAD */}

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
            duration: 0.6,
            delay: 0.1,
          }}
          className="
            mt-8
            sm:mt-10
            md:mt-12
            w-full
          "
        >
          <motion.div
            animate={{
              y: [0, -4, 0],
            }}
            transition={{
              duration: 6,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="
              relative
              w-full
              max-w-4xl
              mx-auto
            "
          >
            <div className="relative w-full">
              <UploadZone />
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}