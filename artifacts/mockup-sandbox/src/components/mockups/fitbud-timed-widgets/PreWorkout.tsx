import React from "react";

const copy = {
  tr: {
    eyebrow: "ANTRENMAN YAKLAŞIYOR",
    time: "BUGÜN · 18:30",
    title: "Hazır mısın?",
    detail: "Antrenmanına 15 dakika kaldı.",
    action: "Isınmaya başla",
    tap: "Açmak için dokun",
    state: "PLANLANDI",
  },
  en: {
    eyebrow: "WORKOUT COMING UP",
    time: "TODAY · 18:30",
    title: "Ready to go?",
    detail: "Your workout starts in 15 minutes.",
    action: "Start warm-up",
    tap: "Tap to open",
    state: "PLANNED",
  },
  de: {
    eyebrow: "TRAINING STEHT AN",
    time: "HEUTE · 18:30",
    title: "Bereit?",
    detail: "Dein Training beginnt in 15 Minuten.",
    action: "Aufwärmen starten",
    tap: "Zum Öffnen tippen",
    state: "GEPLANT",
  },
  fr: {
    eyebrow: "SÉANCE IMMINENTE",
    time: "AUJOURD’HUI · 18:30",
    title: "Prêt·e ?",
    detail: "Ta séance commence dans 15 minutes.",
    action: "Commencer l’échauffement",
    tap: "Appuyer pour ouvrir",
    state: "PLANIFIÉE",
  },
  es: {
    eyebrow: "ENTRENO PRÓXIMO",
    time: "HOY · 18:30",
    title: "¿Todo listo?",
    detail: "Tu entrenamiento empieza en 15 minutos.",
    action: "Empezar calentamiento",
    tap: "Toca para abrir",
    state: "PLANIFICADO",
  },
} as const;

export function PreWorkout() {
  const t = copy.tr;

  return (
    <main
      aria-label="FitBud pre-workout Android widget preview"
      style={{
        width: 430,
        height: 310,
        boxSizing: "border-box",
        overflow: "hidden",
        padding: 20,
        display: "grid",
        placeItems: "center",
        background:
          "radial-gradient(ellipse at 18% 5%, rgba(190,224,255,.94), transparent 48%), linear-gradient(145deg,#dbeafb 0%,#c8dff5 52%,#bed4eb 100%)",
        fontFamily: "'DM Sans', 'Segoe UI', sans-serif",
        color: "#132944",
        position: "relative",
      }}
    >
      <div
        style={{
          position: "absolute",
          left: 16,
          top: 12,
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: ".15em",
          color: "rgba(30,66,104,.52)",
        }}
      >
        ANDROID HOME
      </div>
      <div
        style={{
          position: "absolute",
          right: 18,
          top: 12,
          fontSize: 11,
          fontWeight: 700,
          color: "rgba(30,66,104,.52)",
          letterSpacing: ".04em",
        }}
      >
        18:15
      </div>

      <section
        role="button"
        tabIndex={0}
        aria-label="FitBud widget. Açmak için dokun."
        onClick={() => undefined}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") event.preventDefault();
        }}
        style={{
          width: "100%",
          height: 226,
          boxSizing: "border-box",
          position: "relative",
          overflow: "hidden",
          borderRadius: 28,
          background:
            "linear-gradient(118deg, rgba(77,173,226,.96) 0%, rgba(73,158,216,.96) 60%, rgba(63,142,201,.98) 100%)",
          boxShadow:
            "0 14px 30px rgba(42,83,126,.22), 0 2px 5px rgba(28,74,117,.15), inset 0 1px 0 rgba(255,255,255,.42)",
          border: "1px solid rgba(255,255,255,.45)",
          cursor: "pointer",
          outline: "none",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(90deg, rgba(8,56,101,.28), rgba(8,56,101,.03) 68%), radial-gradient(ellipse at 93% 100%, rgba(15,67,114,.3), transparent 48%)",
            pointerEvents: "none",
          }}
        />
        <div
          style={{
            position: "absolute",
            left: 20,
            top: 20,
            bottom: 18,
            zIndex: 2,
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-start",
            width: 250,
          }}
        >
          <div
            style={{
              display: "flex",
              gap: 7,
              alignItems: "center",
              color: "rgba(244,250,255,.83)",
              fontSize: 9,
              fontWeight: 800,
              letterSpacing: ".15em",
              whiteSpace: "nowrap",
            }}
          >
            <span
              style={{
                display: "inline-block",
                width: 6,
                height: 6,
                borderRadius: 99,
                background: "#C9F0FF",
                boxShadow: "0 0 0 3px rgba(201,240,255,.17)",
              }}
            />
            {t.eyebrow}
          </div>

          <div
            style={{
              marginTop: 11,
              display: "inline-flex",
              alignItems: "center",
              padding: "5px 9px",
              borderRadius: 8,
              background: "rgba(8,55,96,.28)",
              color: "#EAF7FF",
              fontSize: 10,
              fontWeight: 750,
              letterSpacing: ".07em",
            }}
          >
            {t.time}
          </div>

          <div
            style={{
              marginTop: 12,
              fontSize: 29,
              lineHeight: 1.05,
              letterSpacing: "-.045em",
              fontWeight: 800,
              color: "#F7FCFF",
              textShadow: "0 1px 1px rgba(22,63,98,.14)",
            }}
          >
            {t.title}
          </div>
          <div
            style={{
              marginTop: 7,
              color: "rgba(244,250,255,.9)",
              fontSize: 12,
              fontWeight: 550,
              letterSpacing: "-.01em",
              whiteSpace: "nowrap",
            }}
          >
            {t.detail}
          </div>

          <div
            style={{
              marginTop: "auto",
              minHeight: 37,
              boxSizing: "border-box",
              borderRadius: 12,
              padding: "0 12px",
              display: "flex",
              alignItems: "center",
              gap: 9,
              background: "#F1F9FF",
              color: "#15527D",
              fontSize: 12,
              fontWeight: 800,
              boxShadow: "0 3px 8px rgba(11,62,105,.14)",
              whiteSpace: "nowrap",
            }}
          >
            <span>{t.action}</span>
            <span aria-hidden="true" style={{ fontSize: 16, lineHeight: 1 }}>
              →
            </span>
          </div>
        </div>

        <div
          style={{
            position: "absolute",
            zIndex: 1,
            right: -38,
            bottom: -4,
            width: 218,
            height: 212,
            pointerEvents: "none",
          }}
        >
          <img
            src="/__mockup/images/fitbud-reference.png"
            alt="FitBud, translucent sky-blue fitness mascot in a gray athletic top"
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              objectPosition: "48% 26%",
              mixBlendMode: "screen",
              filter: "saturate(.86) contrast(.97)",
              maskImage:
                "linear-gradient(90deg, transparent 0%, rgba(0,0,0,.45) 16%, #000 38%)",
            }}
          />
        </div>

        <div
          style={{
            position: "absolute",
            zIndex: 3,
            right: 14,
            top: 14,
            padding: "5px 8px",
            borderRadius: 7,
            background: "rgba(11,61,101,.32)",
            color: "rgba(240,249,255,.88)",
            fontSize: 8,
            lineHeight: 1,
            fontWeight: 800,
            letterSpacing: ".1em",
          }}
        >
          {t.state}
        </div>
        <div
          style={{
            position: "absolute",
            zIndex: 3,
            right: 15,
            bottom: 13,
            color: "rgba(235,247,255,.68)",
            fontSize: 8,
            fontWeight: 650,
            letterSpacing: ".03em",
          }}
        >
          {t.tap}
        </div>
      </section>

      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          bottom: 8,
          width: 104,
          height: 4,
          borderRadius: 8,
          background: "rgba(35,71,107,.28)",
        }}
      />
    </main>
  );
}

export default PreWorkout;
