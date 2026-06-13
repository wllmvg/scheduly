import { Menu, X, CalendarDays } from "lucide-react";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useLocation } from "react-router-dom";

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  return (
    <header className="fixed inset-x-0 top-0 z-50 backdrop-blur-xl bg-black/70 border-b border-white/10">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6">
        <div className="h-20 flex items-center justify-between">
          <Link
            to="/"
            className="flex items-center gap-2 sm:gap-3 min-w-0"
          >
            <CalendarDays className="text-blue-500 shrink-0" />

            <AnimatePresence mode="wait">
              <motion.span
                key={location.pathname === "/" ? "logo" : "home"}
                initial={{
                  opacity: 0,
                  x: -15,
                }}
                animate={{
                  opacity: 1,
                  x: 0,
                }}
                exit={{
                  opacity: 0,
                  x: 15,
                }}
                transition={{
                  duration: 0.25,
                }}
                className="font-bold text-base sm:text-xl truncate bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent"
              >
                {location.pathname === "/"
                  ? "Scheduly - UDES"
                  : "Volver a inicio"}
              </motion.span>
            </AnimatePresence>
          </Link>

          <nav className="hidden md:flex items-center gap-10">
            <Link
              to="/features"
              className="hover:text-blue-400 transition"
            >
              ¿Cómo funciona?
            </Link>

            <Link
              to="/credits"
              className="hover:text-blue-400 transition"
            >
              Créditos
            </Link>
          </nav>

          <button
            onClick={() => setOpen(!open)}
            className="md:hidden p-1 shrink-0"
            aria-label="Abrir menú"
          >
            {open ? <X /> : <Menu />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="md:hidden overflow-hidden border-t border-white/10 bg-[#050816]/95 backdrop-blur-xl"
          >
            <div className="flex flex-col p-6 gap-5">
              <Link
                to="/features"
                className="hover:text-blue-400 transition"
              >
                ¿Cómo funciona?
              </Link>

              <Link
                to="/credits"
                className="hover:text-blue-400 transition"
              >
                Créditos
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}