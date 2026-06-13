import { Menu, X, CalendarDays } from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";

export default function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 w-full z-50 backdrop-blur-xl bg-black/70 border-b border-white/10 ">
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        <Link
          to="/"
          className="flex items-center gap-3 font-bold text-xl"
        >
          <CalendarDays className="text-blue-500" />

          <span className="bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">
            Scheduly - UDES
          </span>
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
          className="md:hidden"
        >
          {open ? <X /> : <Menu />}
        </button>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{
              opacity: 0,
              height: 0,
            }}
            animate={{
              opacity: 1,
              height: "auto",
            }}
            exit={{
              opacity: 0,
              height: 0,
            }}
            className="md:hidden border-t border-white/10 bg-[#050816]/95 backdrop-blur-xl"
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
                onClick={() => setOpen(false)}
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