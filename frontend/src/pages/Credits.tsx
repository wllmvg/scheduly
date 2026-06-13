import { motion } from "framer-motion";

import profilePhoto from "../assets/foto_perfil_william.jpeg";

import {
  CalendarDays,
  Rocket,
  Code2,
  GraduationCap,
  Users,
  Clock3,
  CalendarCheck,
} from "lucide-react";

import {
  FaGithub,
  FaLinkedin,
  FaInstagram,
} from "react-icons/fa";

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

export default function Credits() {
  return (
    <>

      <main className="
        relative
        px-4
        sm:px-6
        pt-8
      ">
        {/* Background Effects */}

        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-20 left-10 w-96 h-96 bg-blue-500/10 rounded-full blur-[120px]" />

          <div className="absolute bottom-20 right-10 w-96 h-96 bg-cyan-500/10 rounded-full blur-[120px]" />
        </div>

        <div className="max-w-6xl mx-auto relative z-10">
          {/* HERO */}

          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="show"
            transition={{ duration: 0.8 }}
            className="
              rounded-3xl
              border
              border-white/10
              bg-white/5
              backdrop-blur-xl
              p-10
              overflow-hidden
            "
          >
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <span
                  className="
                    inline-flex
                    items-center
                    gap-2
                    px-4
                    py-2
                    rounded-full
                    bg-blue-500/10
                    border
                    border-blue-500/20
                    text-blue-400
                  "
                >
                  <CalendarDays size={16} />
                  Creador de Scheduly UDES
                </span>

                <h1 className="mt-6 text-5xl md:text-6xl font-black">
                  William Vega
                </h1>

                <p className="mt-4 text-2xl bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent font-semibold">
                  Software Developer
                </p>

                <p className="mt-8 text-gray-300 leading-relaxed text-lg">
                  Estudiante de Ingeniería de Software
                  enfocado en el desarrollo de
                  soluciones tecnológicas que
                  simplifiquen procesos reales para
                  estudiantes, docentes y organizaciones.
                </p>

                <p className="mt-4 text-gray-400 leading-relaxed">
                  Scheduly fue desarrollado para eliminar
                  una tarea repetitiva que cientos de
                  estudiantes realizan cada semestre:
                  registrar manualmente cada clase dentro
                  de Google Calendar.
                </p>

                <div className="flex gap-4 mt-8">
                  <a
                    href="https://github.com/wllmvg"
                    target="_blank"
                    rel="noreferrer"
                    className="
                      p-4
                      rounded-2xl
                      bg-white/5
                      border
                      border-white/10
                      hover:bg-white/10
                      hover:scale-110
                      transition-all
                    "
                  >
                    <FaGithub size={22} />
                  </a>

                  <a
                    href="https://www.linkedin.com/in/wllmvg/"
                    target="_blank"
                    rel="noreferrer"
                    className="
                      p-4
                      rounded-2xl
                      bg-white/5
                      border
                      border-white/10
                      hover:bg-white/10
                      hover:scale-110
                      transition-all
                    "
                  >
                    <FaLinkedin size={22} />
                  </a>

                  <a
                    href="https://www.instagram.com/wllmvg.rar/"
                    target="_blank"
                    rel="noreferrer"
                    className="
                      p-4
                      rounded-2xl
                      bg-white/5
                      border
                      border-white/10
                      hover:bg-white/10
                      hover:scale-110
                      transition-all
                    "
                  >
                    <FaInstagram size={22} />
                  </a>
                </div>
              </div>

              <motion.div
                animate={{
                  y: [0, -12, 0],
                }}
                transition={{
                  duration: 5,
                  repeat: Infinity,
                }}
                className="flex justify-center"
              >
                <img
                  src={profilePhoto}
                  alt="William Vega"
                  className="
                    w-80
                    h-80
                    object-cover
                    rounded-3xl
                    border
                    border-white/10
                    shadow-[0_0_60px_rgba(59,130,246,0.25)]
                  "
                />
              </motion.div>
            </div>
          </motion.div>

          {/* STATS */}

          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="grid md:grid-cols-3 gap-6 mt-12"
          >
            <div className="p-8 rounded-3xl bg-white/5 border border-white/10 text-center">
              <Clock3
                size={40}
                className="mx-auto text-blue-400"
              />

              <h3 className="mt-4 text-3xl font-black">
                5 Seg.
              </h3>

              <p className="text-gray-400">
                Conversión promedio
              </p>
            </div>

            <div className="p-8 rounded-3xl bg-white/5 border border-white/10 text-center">
              <CalendarCheck
                size={40}
                className="mx-auto text-blue-400"
              />

              <h3 className="mt-4 text-3xl font-black">
                100%
              </h3>

              <p className="text-gray-400">
                Automatizado
              </p>
            </div>

            <div className="p-8 rounded-3xl bg-white/5 border border-white/10 text-center">
              <Users
                size={40}
                className="mx-auto text-blue-400"
              />

              <h3 className="mt-4 text-3xl font-black">
                UDES
              </h3>

              <p className="text-gray-400">
                Primera universidad soportada
              </p>
            </div>
          </motion.div>

          {/* WHY */}

          <section className="mt-24">
            <motion.h2
              variants={fadeUp}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true }}
              className="text-5xl font-black text-center"
            >
              ¿Por qué nació Scheduly?
            </motion.h2>

            <div className="grid md:grid-cols-3 gap-8 mt-14">
              {[
                {
                  icon: GraduationCap,
                  title: "Problema real",
                  desc:
                    "Registrar materias manualmente en Google Calendar consume tiempo y genera errores frecuentes.",
                },
                {
                  icon: Code2,
                  title: "Solución",
                  desc:
                    "Interpretar automáticamente el PDF institucional y convertirlo a un calendario listo para importar.",
                },
                {
                  icon: Rocket,
                  title: "Visión",
                  desc:
                    "Construir una plataforma que facilite la organización académica para miles de estudiantes.",
                },
              ].map((item, index) => (
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
                  viewport={{ once: true }}
                  transition={{
                    delay: index * 0.15,
                  }}
                  className="
                    p-8
                    rounded-3xl
                    bg-white/5
                    border
                    border-white/10
                    hover:border-blue-500/30
                    hover:-translate-y-2
                    transition-all
                  "
                >
                  <item.icon
                    size={42}
                    className="text-blue-400"
                  />

                  <h3 className="mt-5 text-xl font-bold">
                    {item.title}
                  </h3>

                  <p className="mt-3 text-gray-400">
                    {item.desc}
                  </p>
                </motion.div>
              ))}
            </div>
          </section>

          {/* IMPACT */}

          <section className="mt-24">
            <motion.div
              variants={fadeUp}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true }}
              className="
                rounded-3xl
                bg-gradient-to-r
                from-blue-500/10
                to-cyan-500/10
                border
                border-blue-500/20
                p-12
                text-center
              "
            >
              <h2 className="text-5xl font-black">
                Impacto del proyecto
              </h2>

              <p className="mt-8 max-w-3xl mx-auto text-lg text-gray-300 leading-relaxed">
                Más que un simple conversor de PDF,
                Scheduly busca demostrar cómo el
                desarrollo de software puede resolver
                problemas cotidianos mediante
                automatización, experiencia de usuario
                y tecnología accesible para toda la
                comunidad universitaria.
              </p>

              <p className="mt-6 text-blue-400 font-semibold">
                Diseñado y desarrollado por William Vega · 2026
              </p>
            </motion.div>
          </section>
        </div>
      </main>
    </>
  );
}