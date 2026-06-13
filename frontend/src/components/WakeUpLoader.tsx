import { useEffect, useState, useRef } from "react";

const API_URL = import.meta.env.VITE_API_URL as string;
const PING_ENDPOINT = `${API_URL}/api/ping`;
const SHOW_LOADER_AFTER_MS = 2000;

interface WakeUpLoaderProps {
  children: React.ReactNode;
}

const MESSAGES = [
  "Despertando el servidor...",
  "Esto puede tardar hasta 60 segundos",
  "Usamos el plan gratuito de Render 🐢",
  "Ya casi está listo...",
];

export default function WakeUpLoader({ children }: WakeUpLoaderProps) {
  const [backendReady, setBackendReady] = useState(false);
  const [showWakeUp, setShowWakeUp] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [msgIndex, setMsgIndex] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const msgTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    let cancelled = false;

    const loaderTimeout = setTimeout(() => {
      if (!cancelled) setShowWakeUp(true);
    }, SHOW_LOADER_AFTER_MS);

    timerRef.current = setInterval(() => {
      setElapsed((e) => e + 1);
    }, 1000);

    msgTimerRef.current = setInterval(() => {
      setMsgIndex((i) => (i + 1) % MESSAGES.length);
    }, 7000);

    const ping = async () => {
      while (!cancelled) {
        try {
          const res = await fetch(PING_ENDPOINT, {
            method: "GET",
            signal: AbortSignal.timeout(10_000),
          });
          if (res.ok && !cancelled) {
            clearTimeout(loaderTimeout);
            if (timerRef.current) clearInterval(timerRef.current);
            if (msgTimerRef.current) clearInterval(msgTimerRef.current);
            setBackendReady(true);
            return;
          }
        } catch {
          // Servidor todavía dormido, reintentamos
        }
        await new Promise((r) => setTimeout(r, 5000));
      }
    };

    ping();

    return () => {
      cancelled = true;
      clearTimeout(loaderTimeout);
      if (timerRef.current) clearInterval(timerRef.current);
      if (msgTimerRef.current) clearInterval(msgTimerRef.current);
    };
  }, []);

  if (backendReady) return <>{children}</>;
  if (!showWakeUp) return null;

  return (
    <div style={styles.overlay}>
      <div style={styles.card}>
        <div style={styles.iconWrap}>
          <svg
            width="56"
            height="56"
            viewBox="0 0 56 56"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            style={styles.icon}
          >
            <circle cx="28" cy="28" r="26" fill="#1e293b" stroke="#334155" strokeWidth="2" />
            <path
              d="M36 20C33.5 22.5 32 26 32 28C32 33.5 36.5 38 42 38C40 41 36.5 43 32.5 43C26 43 21 38 21 31.5C21 25 26 20 32.5 20C33.7 20 34.9 20.2 36 20Z"
              fill="#94a3b8"
            />
            <circle cx="14" cy="14" r="1.5" fill="#f1f5f9" style={{ animation: "twinkle 1.8s infinite" }} />
            <circle cx="42" cy="12" r="1" fill="#f1f5f9" style={{ animation: "twinkle 2.4s infinite 0.5s" }} />
            <circle cx="10" cy="30" r="1" fill="#f1f5f9" style={{ animation: "twinkle 2s infinite 1s" }} />
            <circle cx="46" cy="24" r="1.5" fill="#f1f5f9" style={{ animation: "twinkle 1.6s infinite 0.8s" }} />
          </svg>
        </div>

        <h2 style={styles.title}>Despertando el servidor</h2>

        <div style={styles.barTrack}>
          <div style={styles.barFill} />
        </div>

        <p style={styles.message} key={msgIndex}>
          {MESSAGES[msgIndex]}
        </p>

        <p style={styles.counter}>{elapsed}s transcurridos</p>

        <div style={styles.infoBox}>
          <span style={styles.infoIcon}>ℹ️</span>
          <p style={styles.infoText}>
            Scheduly usa el plan gratuito de Render. El servidor se apaga cuando
            no hay actividad y puede tardar <strong>hasta 60 segundos</strong> en
            volver. Una vez despierto, todo funciona con normalidad.
          </p>
        </div>
      </div>

      <style>{`
        @keyframes twinkle {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.2; }
        }
        @keyframes slide {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(400%); }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(4px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: "fixed",
    inset: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
    zIndex: 9999,
    padding: "20px",
  },
  card: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "16px",
    maxWidth: "380px",
    width: "100%",
    textAlign: "center",
  },
  iconWrap: {
    marginBottom: "4px",
  },
  icon: {
    filter: "drop-shadow(0 0 16px rgba(148,163,184,0.3))",
  },
  title: {
    color: "#f1f5f9",
    fontSize: "22px",
    fontWeight: 700,
    margin: 0,
    letterSpacing: "-0.3px",
  },
  barTrack: {
    width: "100%",
    height: "4px",
    background: "#334155",
    borderRadius: "2px",
    overflow: "hidden",
  },
  barFill: {
    height: "100%",
    width: "35%",
    background: "linear-gradient(90deg, #38bdf8, #818cf8)",
    borderRadius: "2px",
    animation: "slide 1.8s ease-in-out infinite",
  },
  message: {
    color: "#94a3b8",
    fontSize: "15px",
    margin: 0,
    animation: "fadeIn 0.4s ease",
    minHeight: "22px",
  },
  counter: {
    color: "#475569",
    fontSize: "13px",
    margin: 0,
    fontVariantNumeric: "tabular-nums",
  },
  infoBox: {
    display: "flex",
    gap: "10px",
    alignItems: "flex-start",
    background: "#1e293b",
    border: "1px solid #334155",
    borderRadius: "10px",
    padding: "12px 14px",
    marginTop: "4px",
    textAlign: "left",
  },
  infoIcon: {
    fontSize: "16px",
    flexShrink: 0,
    marginTop: "1px",
  },
  infoText: {
    color: "#64748b",
    fontSize: "13px",
    margin: 0,
    lineHeight: "1.5",
  },
};