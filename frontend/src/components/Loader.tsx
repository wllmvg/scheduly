import { motion } from "framer-motion";
import { CalendarDays } from "lucide-react";

export default function Loader() {
  return (
    <div className="fixed inset-0 bg-[#050816]/95 backdrop-blur-xl flex items-center justify-center z-50">
      <div className="relative flex flex-col items-center">
        <motion.div
          animate={{
            rotate: 360,
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "linear",
          }}
          className="absolute w-40 h-40 border border-blue-500/20 rounded-full"
        />

        <motion.div
          animate={{
            rotate: -360,
          }}
          transition={{
            duration: 6,
            repeat: Infinity,
            ease: "linear",
          }}
          className="absolute w-56 h-56 border border-cyan-500/10 rounded-full"
        />

        <motion.div
          animate={{
            scale: [1, 1.15, 1],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
          }}
          className="
            w-24
            h-24
            rounded-full
            bg-gradient-to-r
            from-blue-500
            to-cyan-400
            flex
            items-center
            justify-center
            shadow-[0_0_50px_rgba(59,130,246,0.5)]
          "
        >
          <CalendarDays size={42} />
        </motion.div>

        <motion.h3
          animate={{
            opacity: [0.5, 1, 0.5],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
          }}
          className="mt-24 text-2xl font-bold"
        >
          Generando calendario...
        </motion.h3>

        <p className="mt-3 text-gray-400 text-center max-w-sm">
          Analizando tu horario académico y
          preparando el archivo compatible con tu
          calendario.
        </p>
      </div>
    </div>
  );
}