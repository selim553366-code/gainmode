import React, { useState } from "react";

const copy = {
  tr: {
    moment: "ANTRENMAN TAMAMLANDI",
    title: "Bugün kendin için",
    titleLine2: "sözünü tuttun.",
    praise: "Seninle gurur duyuyorum.",
    earned: "BUGÜN KAZANDIKLARIN",
    minutes: "38 dk",
    streak: "4 günlük seri",
    open: "FitBud'u aç",
    tap: "Ayrıntılar için dokun",
    launch: "FitBud açılıyor",
  },
  en: {
    moment: "WORKOUT COMPLETE",
    title: "You showed up",
    titleLine2: "for yourself today.",
    praise: "I'm proud of you.",
    earned: "TODAY, YOU EARNED",
    minutes: "38 min",
    streak: "4-day streak",
    open: "Open FitBud",
    tap: "Tap for details",
    launch: "Opening FitBud",
  },
  de: {
    moment: "TRAINING ABGESCHLOSSEN",
    title: "Heute hast du",
    titleLine2: "Wort gehalten.",
    praise: "Ich bin stolz auf dich.",
    earned: "DAS HAST DU HEUTE GESCHAFFT",
    minutes: "38 Min.",
    streak: "4-Tage-Serie",
    open: "FitBud öffnen",
    tap: "Tippen für Details",
    launch: "FitBud wird geöffnet",
  },
  fr: {
    moment: "SÉANCE TERMINÉE",
    title: "Aujourd'hui, tu as",
    titleLine2: "tenu ta promesse.",
    praise: "Je suis fier de toi.",
    earned: "TES VICTOIRES DU JOUR",
    minutes: "38 min",
    streak: "4 jours d'affilée",
    open: "Ouvrir FitBud",
    tap: "Appuie pour les détails",
    launch: "FitBud s'ouvre",
  },
  es: {
    moment: "ENTRENAMIENTO COMPLETADO",
    title: "Hoy cumpliste",
    titleLine2: "contigo mismo.",
    praise: "Estoy orgulloso de ti.",
    earned: "LO QUE GANASTE HOY",
    minutes: "38 min",
    streak: "4 días seguidos",
    open: "Abrir FitBud",
    tap: "Toca para ver detalles",
    launch: "Abriendo FitBud",
  },
} as const;

type Language = keyof typeof copy;

const languages: Language[] = ["tr", "en", "de", "fr", "es"];

export function AfterWorkout() {
  const [language, setLanguage] = useState<Language>("tr");
  const [launching, setLaunching] = useState(false);
  const text = copy[language];

  const openApp = () => {
    setLaunching(true);
    window.setTimeout(() => setLaunching(false), 1600);
  };

  return (
    <main
      style={{
        width: "100%",
        height: "100%",
        minHeight: 310,
        boxSizing: "border-box",
        overflow: "hidden",
        position: "relative",
        padding: "15px 16px 14px",
        color: "#f4fbff",
        fontFamily: "'DM Sans', 'Segoe UI', sans-serif",
        background:
          "radial-gradient(ellipse at 18% 9%, rgba(234,163,105,.24), transparent 39%), radial-gradient(ellipse at 94% 86%, rgba(74,154,186,.34), transparent 44%), linear-gradient(145deg,#33485a 0%,#243d50 54%,#1e3445 100%)",
      }}
    >
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          opacity: 0.11,
          pointerEvents: "none",
          backgroundImage:
            "radial-gradient(rgba(255,255,255,.65) .55px, transparent .55px)",
          backgroundSize: "5px 5px",
        }}
      />
      <header
        style={{
          height: 22,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          position: "relative",
          zIndex: 1,
          padding: "0 3px",
        }}
      >
        <span style={{ fontSize: 13, fontWeight: 700, letterSpacing: ".02em" }}>
          16:42
        </span>
        <nav
          aria-label="Preview language"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 3,
            padding: 3,
            borderRadius: 12,
            background: "rgba(9,27,40,.28)",
            border: "1px solid rgba(231,246,255,.12)",
          }}
        >
          {languages.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setLanguage(item)}
              aria-pressed={language === item}
              style={{
                border: 0,
                borderRadius: 9,
                padding: "4px 6px",
                color: language === item ? "#25475a" : "rgba(239,248,253,.74)",
                background: language === item ? "#d8f2fb" : "transparent",
                fontSize: 9,
                fontWeight: 800,
                lineHeight: 1,
                cursor: "pointer",
                textTransform: "uppercase",
                fontFamily: "inherit",
              }}
            >
              {item}
            </button>
          ))}
        </nav>
        <div
          aria-hidden="true"
          style={{ display: "flex", alignItems: "center", gap: 5 }}
        >
          <span style={{ fontSize: 11 }}>◔</span>
          <span
            style={{
              width: 16,
              height: 8,
              border: "1px solid rgba(244,251,255,.75)",
              borderRadius: 3,
              display: "inline-flex",
              padding: 1,
              boxSizing: "border-box",
            }}
          >
            <span
              style={{
                width: "72%",
                borderRadius: 1,
                background: "#f4fbff",
              }}
            />
          </span>
        </div>
      </header>

      <button
        type="button"
        onClick={openApp}
        aria-label={text.open}
        style={{
          appearance: "none",
          textAlign: "left",
          display: "block",
          width: "100%",
          height: 218,
          position: "relative",
          overflow: "hidden",
          marginTop: 10,
          padding: 0,
          border: "1px solid rgba(222,246,255,.48)",
          borderRadius: 26,
          color: "inherit",
          cursor: "pointer",
          background:
            "linear-gradient(120deg,rgba(74,181,220,.91),rgba(86,173,208,.86) 52%,rgba(43,135,174,.94))",
          boxShadow:
            "0 15px 30px rgba(10,26,37,.26), inset 0 1px 0 rgba(255,255,255,.24)",
          fontFamily: "inherit",
          WebkitTapHighlightColor: "transparent",
        }}
      >
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: 0,
            background:
              "radial-gradient(ellipse at 16% 0%,rgba(231,250,255,.32),transparent 45%), linear-gradient(90deg,rgba(48,151,190,.13),transparent 60%)",
          }}
        />
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            width: 194,
            height: 194,
            right: -23,
            top: 20,
            borderRadius: "50%",
            border: "1px solid rgba(225,247,255,.22)",
            boxShadow:
              "0 0 0 12px rgba(218,244,255,.055), 0 0 0 25px rgba(218,244,255,.04)",
          }}
        />
        <img
          src="/__mockup/images/fitbud-reference.png"
          alt="FitBud, proud after a workout"
          style={{
            position: "absolute",
            right: -1,
            bottom: -24,
            width: 198,
            height: 220,
            objectFit: "cover",
            objectPosition: "32% 38%",
            mixBlendMode: "screen",
            opacity: 0.97,
            WebkitMaskImage:
              "linear-gradient(to right, transparent 0%, black 18%, black 100%)",
            maskImage:
              "linear-gradient(to right, transparent 0%, black 18%, black 100%)",
          }}
        />

        <div
          style={{
            position: "absolute",
            inset: "15px 0 14px 17px",
            width: "59%",
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-start",
            zIndex: 1,
          }}
        >
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "5px 8px",
              borderRadius: 99,
              color: "#fff8e9",
              background: "rgba(105,71,51,.3)",
              border: "1px solid rgba(255,238,204,.25)",
              fontSize: 8,
              fontWeight: 800,
              letterSpacing: ".09em",
              whiteSpace: "nowrap",
            }}
          >
            <span
              aria-hidden="true"
              style={{
                display: "inline-block",
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: "#ffd28a",
                boxShadow: "0 0 0 3px rgba(255,210,138,.18)",
              }}
            />
            {text.moment}
          </div>

          <div
            style={{
              marginTop: 10,
              fontSize: 19,
              lineHeight: 1.14,
              letterSpacing: "-.045em",
              fontWeight: 800,
              color: "#fff",
              textShadow: "0 1px 8px rgba(24,81,107,.16)",
            }}
          >
            {text.title}
            <br />
            {text.titleLine2}
          </div>
          <div
            style={{
              marginTop: 5,
              color: "rgba(242,251,255,.91)",
              fontSize: 10,
              fontWeight: 600,
            }}
          >
            {text.praise}
          </div>

          <div
            style={{
              marginTop: "auto",
              width: "100%",
              paddingTop: 8,
              borderTop: "1px solid rgba(235,250,255,.32)",
            }}
          >
            <div
              style={{
                fontSize: 7,
                lineHeight: 1,
                fontWeight: 800,
                letterSpacing: ".1em",
                color: "rgba(236,249,255,.77)",
                whiteSpace: "nowrap",
              }}
            >
              {text.earned}
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                marginTop: 7,
              }}
            >
              <span
                aria-hidden="true"
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: "50%",
                  display: "grid",
                  placeItems: "center",
                  color: "#6a4a2c",
                  fontSize: 12,
                  fontWeight: 900,
                  background:
                    "linear-gradient(145deg,#fff0bd,#f2bb6d 70%,#d9964e)",
                  border: "1px solid rgba(255,248,218,.82)",
                  boxShadow: "0 2px 7px rgba(66,63,48,.18)",
                }}
              >
                ✓
              </span>
              <span
                style={{
                  color: "#fff",
                  fontSize: 11,
                  fontWeight: 800,
                  whiteSpace: "nowrap",
                }}
              >
                {text.minutes}
              </span>
              <span
                style={{
                  width: 1,
                  height: 12,
                  background: "rgba(239,250,255,.42)",
                }}
              />
              <span
                style={{
                  color: "#fff6e8",
                  fontSize: 9,
                  fontWeight: 700,
                  whiteSpace: "nowrap",
                }}
              >
                {text.streak}
              </span>
            </div>
          </div>
        </div>

        <div
          style={{
            position: "absolute",
            right: 13,
            top: 13,
            width: 26,
            height: 26,
            display: "grid",
            placeItems: "center",
            borderRadius: "50%",
            color: "#815b35",
            background: "linear-gradient(145deg,#fff0c2,#f0b45f)",
            boxShadow: "0 3px 10px rgba(54,75,71,.18)",
            fontSize: 13,
            fontWeight: 900,
          }}
        >
          ✓
        </div>
        <div
          style={{
            position: "absolute",
            right: 13,
            bottom: 12,
            zIndex: 2,
            padding: "5px 8px",
            borderRadius: 99,
            color: "rgba(242,251,255,.94)",
            background: "rgba(31,90,117,.55)",
            fontSize: 8,
            fontWeight: 700,
            letterSpacing: ".01em",
          }}
        >
          {launching ? text.launch : text.tap}
        </div>
      </button>

      <footer
        style={{
          height: 24,
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "center",
          position: "relative",
          zIndex: 1,
        }}
      >
        <div
          aria-hidden="true"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 11,
            padding: "4px 10px",
            borderRadius: 14,
            background: "rgba(12,31,44,.3)",
            border: "1px solid rgba(228,244,255,.13)",
          }}
        >
          {["#e7c49d", "#b7dae7", "#e9d6b5", "#b4d6d1"].map((color, index) => (
            <span
              key={color}
              style={{
                width: 11,
                height: 11,
                borderRadius: index === 1 ? 4 : 50,
                background: color,
                opacity: 0.9,
                boxShadow: "0 1px 3px rgba(0,0,0,.17)",
              }}
            />
          ))}
        </div>
      </footer>
    </main>
  );
}
