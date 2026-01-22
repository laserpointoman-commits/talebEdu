import { useEffect } from "react";
import { cn } from "@/lib/utils";
import { Check, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export type ScanFeedbackState =
  | { open: false }
  | {
      open: true;
      type: "success" | "error";
      title: string;
      subtitle?: string;
    };

function useBeep(type: "success" | "error", enabled: boolean) {
  useEffect(() => {
    if (!enabled) return;
    // Use WebAudio (works in WebView) to avoid shipping copyrighted sounds.
    try {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext })
          .webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();

      const now = ctx.currentTime;
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.connect(g);
      g.connect(ctx.destination);

      if (type === "success") {
        // Quick 2-tone chime
        o.type = "sine";
        g.gain.setValueAtTime(0.0001, now);
        g.gain.exponentialRampToValueAtTime(0.25, now + 0.01);
        g.gain.exponentialRampToValueAtTime(0.0001, now + 0.18);

        o.frequency.setValueAtTime(880, now);
        o.frequency.setValueAtTime(1320, now + 0.08);
        o.start(now);
        o.stop(now + 0.2);
      } else {
        // Short error buzz
        o.type = "square";
        g.gain.setValueAtTime(0.0001, now);
        g.gain.exponentialRampToValueAtTime(0.18, now + 0.01);
        g.gain.exponentialRampToValueAtTime(0.0001, now + 0.14);
        o.frequency.setValueAtTime(160, now);
        o.start(now);
        o.stop(now + 0.16);
      }

      ctx.close().catch(() => {});
    } catch {
      // ignore
    }
  }, [type, enabled]);
}

export function ScanFeedbackOverlay({
  state,
  soundEnabled = true,
}: {
  state: ScanFeedbackState;
  soundEnabled?: boolean;
}) {
  const open = state.open;
  const type = open ? state.type : "success";
  useBeep(type, open && soundEnabled);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className={cn(
            "fixed inset-0 z-[9999] flex items-center justify-center",
            type === "success" ? "bg-success" : "bg-destructive",
          )}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.08 }}
        >
          <motion.div
            className="w-full max-w-md px-6 text-center text-primary-foreground"
            initial={{ scale: 0.92, y: 10, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.98, y: -6, opacity: 0 }}
            transition={{ type: "spring", stiffness: 700, damping: 35 }}
          >
            <motion.div
              className={cn(
                "mx-auto mb-4 grid h-20 w-20 place-items-center rounded-2xl",
                "bg-background/15 ring-1 ring-background/20",
              )}
              initial={type === "error" ? { rotate: -6 } : { scale: 0.98 }}
              animate={type === "error" ? { rotate: 0 } : { scale: 1 }}
              transition={{ duration: 0.12 }}
            >
              {type === "success" ? (
                <Check className="h-10 w-10" />
              ) : (
                <motion.div
                  initial={{ scale: 0.8 }}
                  animate={{ scale: [0.9, 1.06, 1] }}
                  transition={{ duration: 0.16 }}
                >
                  <X className="h-10 w-10" />
                </motion.div>
              )}
            </motion.div>

            <div className="text-3xl font-extrabold tracking-tight">
              {state.title}
            </div>
            {state.subtitle ? (
              <div className="mt-2 text-base opacity-95">{state.subtitle}</div>
            ) : null}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
