import { CalendarDays } from "lucide-react";

import {
  FaGithub,
  FaLinkedin,
  FaInstagram,
} from "react-icons/fa";

export default function Footer() {
  return (
    <footer
      id="footer"
      className="
        mt-24
        border-t
        border-white/10
        bg-black
      "
    >
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="flex flex-col md:flex-row justify-between gap-10">
          <div>
            <div className="flex items-center gap-3">
              <CalendarDays className="text-blue-500" />

              <span className="font-bold text-xl">
                Scheduly - UDES
              </span>
            </div>

            <p className="mt-4 text-gray-400 max-w-lg leading-relaxed">
              Convierte horarios PDF en calendarios
              compatibles con Google Calendar,
              Outlook y Apple Calendar.
              <br />
              <br />
              Actualmente Scheduly funciona
              exclusivamente con horarios de la
              Universidad de Santander (UDES).
              Próximamente se añadirán nuevas
              universidades y formatos académicos.
            </p>
          </div>

          <div className="flex items-center gap-6 text-2xl">
            <a
              href="https://github.com/wllmvg"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-blue-500 transition hover:scale-110"
            >
              <FaGithub />
            </a>

            <a
              href="https://www.linkedin.com/in/wllmvg/"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-blue-500 transition hover:scale-110"
            >
              <FaLinkedin />
            </a>

            <a
              href="https://www.instagram.com/wllmvg.rar/"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-pink-500 transition hover:scale-110"
            >
              <FaInstagram />
            </a>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-white/5 text-center text-sm text-gray-500">
          © 2026 | William Vega | Scheduly UDES |
          All rights reserved.
        </div>
      </div>
    </footer>
  );
}