import { useRef } from "react";
import {
  motion,
  useScroll,
  useSpring,
} from "framer-motion";
import {
  ArrowLeft,
  ExternalLink,
  CheckCircle2,
} from "lucide-react";
import { Link } from "react-router-dom";
 
const steps = [
  {
    number: "01",
    title: "Ingresa a Génesis y selecciona tu campus",
    description:
      "Accede a Génesis UDES y elige el campus correspondiente a tu sede.",
    image: "/guide/step1.png",
  },
  {
    number: "02",
    title: 'Abre la sección "Horario"',
    description:
      "Una vez dentro de Génesis, ubica y haz clic en la opción Horario dentro del menú.",
    image: "/guide/step2.png",
  },
  {
    number: "03",
    title: 'Haz clic en "Imprimir"',
    description:
      "Dentro de tu horario académico, presiona el botón Imprimir ubicado en la esquina superior derecha.",
    image: "/guide/step3.png",
  },
  {
    number: "04",
    title: "Guarda el PDF y súbelo a Scheduly",
    description:
      "Descarga y guarda el archivo PDF. Luego, súbelo a Scheduly para generar tu calendario digital. Al finalizar el proceso, podrás descargar un archivo de calendario (.ics) y te guiaremos paso a paso para agregarlo a tu calendario según el dispositivo que estés usando.",
    image: "/guide/step4.png",
  },
];
 
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
 
export default function Guide() {
 
    const timelineRef = useRef(null);
 
    const { scrollYProgress } = useScroll({
    target: timelineRef,
    offset: ["start center", "end end"],
    });
 
    const scaleY = useSpring(scrollYProgress, {
    stiffness: 120,
    damping: 30,
    restDelta: 0.001,
    });
  return (
    <section className="relative min-h-screen px-4 sm:px-6 py-10 overflow-hidden">
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
 
      <div className="max-w-6xl mx-auto">
        {/* BACK BUTTON */}
 
        <motion.div
          initial="hidden"
          animate="show"
          variants={fadeUp}
        >
          <Link
            to="/"
            className="
              inline-flex
              items-center
              gap-2
              text-gray-400
              hover:text-cyan-400
              transition-colors
            "
          >
            <ArrowLeft size={18} />
            Volver a Scheduly
          </Link>
        </motion.div>
 
        {/* HERO */}
 
        <motion.div
          initial="hidden"
          animate="show"
          transition={{
            staggerChildren: 0.1,
          }}
          className="text-center mt-8"
        >
          <motion.h1
            variants={fadeUp}
            className="
              text-4xl
              md:text-6xl
              font-black
              leading-tight
            "
          >
            Cómo descargar tu horario
            <span className="block text-cyan-400 mt-2">
              desde Génesis UDES
            </span>
          </motion.h1>
 
          <motion.p
            variants={fadeUp}
            className="
              mt-6
              max-w-3xl
              mx-auto
              text-gray-400
              text-base
              md:text-lg
              leading-relaxed
            "
          >
            Sigue estos pasos para descargar tu horario académico
            oficial y convertirlo en un calendario compatible con
            Google Calendar, Outlook y Apple Calendar.
          </motion.p>
        </motion.div>
 
        {/* STEPS */}
 
        <div
          ref={timelineRef}
          className="
            relative
            mt-16
            pl-8
            lg:pl-14
            space-y-10
          "
        >
 
          {/* Línea de fondo — visible en todos los tamaños */}
          <div
            className="
              absolute
              left-[0.85rem]
              lg:left-[1.32rem]
              top-0
              bottom-0
              w-[2px]
              bg-white/10
            "
          />
 
          {/* Línea animada — visible en todos los tamaños */}
          <motion.div
            style={{ scaleY }}
            className="
              absolute
              left-[0.85rem]
              lg:left-[1.32rem]
              top-0
              h-full
              w-[2px]
              bg-cyan-400
              origin-top
            "
          />
 
          {steps.map((step, index) => (
            <motion.div
              key={step.number}
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
                duration: 0.5,
              }}
              className="
                relative
                rounded-3xl
                border
                border-white/10
                bg-white/5
                backdrop-blur-sm
                overflow-hidden
              "
            >
 
              {/* Círculo del timeline — visible en todos los tamaños */}
              <div
                className="
                  absolute
                  -left-[1.65rem]
                  lg:-left-[2.9rem]
                  top-10
                  w-5
                  h-5
                  lg:w-6
                  lg:h-6
                  rounded-full
                  bg-cyan-400
                  border-4
                  border-slate-950
                "
              />
                
              <div className="grid lg:grid-cols-2">
                {/* IMAGE */}
 
                <div
                  className="
                    flex
                    items-center
                    justify-center
                    bg-black/20
                    min-h-[200px]
                    lg:min-h-[280px]
                  "
                >
                  <img
                    src={step.image}
                    alt={step.title}
                    className="
                      w-full
                      h-full
                      object-cover
                    "
                  />
                </div>
 
                {/* CONTENT */}
 
                <div className="p-6 md:p-8 lg:p-10 flex flex-col justify-center">
                  <div className="text-cyan-400 font-black text-sm tracking-widest">
                    PASO {step.number}
                  </div>
 
                  <h2 className="mt-3 text-xl md:text-2xl lg:text-3xl font-bold">
                    {step.title}
                  </h2>
 
                  <p className="mt-4 text-gray-400 leading-relaxed">
                    {step.description}
                  </p>
 
                  {index === 0 && (
                    <a
                      href="https://udes.edu.co/genesis"
                      target="_blank"
                      rel="noreferrer"
                      className="
                        mt-6
                        inline-flex
                        items-center
                        gap-2
                        text-cyan-400
                        hover:text-cyan-300
                        font-medium
                      "
                    >
                      Abrir Génesis
                      <ExternalLink size={16} />
                    </a>
                  )}
 
                  {index === 3 && (
                    <a
                      href="https://scheduly-psi.vercel.app/"
                      target="_blank"
                      rel="noreferrer"
                      className="
                        mt-6
                        inline-flex
                        items-center
                        gap-2
                        text-cyan-400
                        hover:text-cyan-300
                        font-medium
                      "
                    >
                      Abrir Scheduly
                      <ExternalLink size={16} />
                    </a>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
 
        {/* SUCCESS */}
 
        <motion.div
          initial={{
            opacity: 0,
            y: 30,
          }}
          whileInView={{
            opacity: 1,
            y: 0,
          }}
          viewport={{
            once: true,
          }}
          className="
            mt-16
            rounded-3xl
            border
            border-cyan-500/20
            bg-cyan-500/10
            p-8
            text-center
          "
        >
          <CheckCircle2
            className="mx-auto text-cyan-400"
            size={60}
          />
 
          <h3 className="mt-4 text-2xl font-bold">
            ¡Listo para convertir tu horario!
          </h3>
 
          <p className="mt-3 text-gray-400 max-w-2xl mx-auto">
            Cuando tengas el PDF descargado desde Génesis,
            vuelve a Scheduly y súbelo para generar tu
            calendario digital automáticamente.
          </p>
 
          <Link
            to="/"
            className="
              inline-flex
              items-center
              justify-center
              mt-8
              px-8
              py-4
              rounded-2xl
              bg-cyan-500
              hover:bg-cyan-400
              transition-colors
              font-semibold
              text-black
            "
          >
            Volver a Scheduly
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
 