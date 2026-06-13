import { useRef } from "react";
import { useNavigate } from "react-router-dom";

import { UploadCloud } from "lucide-react";

import { api } from "../services/api";

import { useScheduly } from "../context/SchedulyContext";

export default function UploadZone() {
  const inputRef =
    useRef<HTMLInputElement>(null);

  const navigate = useNavigate();

  const {
    setLoading,
    setDownloadUrl,
  } = useScheduly();

  const handleUpload = async (
    file: File
  ) => {
    try {
      setLoading(true);

      const formData = new FormData();

      formData.append("file", file);

      const response = await api.post(
        "/api/process",
        formData,
        {
          responseType: "blob",
        }
      );

      const blob = new Blob(
        [response.data],
        {
          type: "text/calendar",
        }
      );

      const url =
        window.URL.createObjectURL(blob);

      setDownloadUrl(url);

      navigate("/result");
    } catch (error) {
      console.error(error);

      alert(
        "Error procesando el horario."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="w-full flex justify-center">
      <div
        onClick={() =>
          inputRef.current?.click()
        }
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
        <UploadCloud
          size={64}
          className="mx-auto mb-4"
        />

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
            const file =
              e.target.files?.[0];

            if (file) {
              handleUpload(file);
            }
          }}
        />
      </div>
    </section>
  );
}