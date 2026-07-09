import { useRef } from "react";
import { useNavigate } from "react-router-dom";

import { UploadCloud } from "lucide-react";

import { api } from "../services/api";

import { useScheduly } from "../context/SchedulyContext";

export default function UploadZone() {
  const inputRef = useRef<HTMLInputElement>(null);

  const navigate = useNavigate();

  const { setLoading, setIcsContent } = useScheduly();

  const handleUpload = async (file: File) => {
    try {
      setLoading(true);

      const formData = new FormData();
      formData.append("file", file);

      // El backend responde JSON: { success, ics_content } o { success: false, message }.
      // Antes se pedía responseType: "blob" y se leía el texto crudo de la
      // respuesta (el JSON completo, con los \r\n escapados como texto
      // literal), en vez de parsear el JSON y quedarnos con el campo
      // ics_content real. Eso rompía todo el parseo posterior del .ics.
      const response = await api.post("/api/process", formData);

      const data = response.data as
        | { success: true; ics_content: string }
        | { success: false; message: string };

      if (!data.success) {
        throw new Error(data.message || "No se pudo procesar el horario.");
      }

      const text = data.ics_content;

      if (!text || !text.includes("BEGIN:VCALENDAR")) {
        throw new Error("La respuesta del servidor no es un calendario válido.");
      }

      setIcsContent(text);
      navigate("/result");
    } catch (error) {
      console.error(error);
      alert("Error procesando el horario.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="w-full flex justify-center">
      <div
        onClick={() => inputRef.current?.click()}
        className="
          cursor-pointer
          border-2
          border-dashed
          border-primary
          rounded-3xl
          p-12
          max-w-2xl
          w-full
          text-center
          hover:scale-105
          transition
        "
      >
        <UploadCloud size={64} className="mx-auto mb-4" />

        <h3 className="text-2xl font-bold">
          Sube tu horario PDF
        </h3>

        <p className="opacity-70 mt-2">
          Compatible con horarios UDES
        </p>

        <input
          ref={inputRef}
          type="file"
          accept=".pdf"
          hidden
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleUpload(file);
          }}
        />
      </div>
    </section>
  );
}