import React from "react";

const copy = {
  tr: {
    time: "GÜNAYDIN · 08:12",
    streak: "4 günlük seri",
    headline: "Bugün küçük bir adım yeter.",
    detail: "Hedefine sadece 18 dk kaldı",
    progress: "12 / 30 dk",
    action: "Harekete geç",
    tap: "Açmak için dokun",
    weekday: "SALI, 14 MAYIS",
  },
  en: {
    time: "GOOD MORNING · 08:12",
    streak: "4 day streak",
    headline: "One small step is enough today.",
    detail: "Just 18 min to your goal",
    progress: "12 / 30 min",
    action: "Get moving",
    tap: "Tap to open",
    weekday: "TUESDAY, MAY 14",
  },
  de: {
    time: "GUTEN MORGEN · 08:12",
    streak: "4-Tage-Serie",
    headline: "Heute reicht ein kleiner Schritt.",
    detail: "Noch 18 Min. bis zum Ziel",
    progress: "12 / 30 Min.",
    action: "Los geht’s",
    tap: "Zum Öffnen tippen",
    weekday: "DIENSTAG, 14. MAI",
  },
  fr: {
    time: "BONJOUR · 08:12",
    streak: "Série de 4 jours",
    headline: "Un petit pas suffit aujourd’hui.",
    detail: "Plus que 18 min pour ton objectif",
    progress: "12 / 30 min",
    action: "Je commence",
    tap: "Toucher pour ouvrir",
    weekday: "MARDI 14 MAI",
  },
  es: {
    time: "BUENOS DÍAS · 08:12",
    streak: "Racha de 4 días",
    headline: "Hoy basta con un pequeño paso.",
    detail: "Solo 18 min para tu objetivo",
    progress: "12 / 30 min",
    action: "Empezar",
    tap: "Toca para abrir",
    weekday: "MARTES, 14 DE MAYO",
  },
} as const;

export function Morning() {
  const t = copy.tr;

  return (
    <main
      className="relative flex h-[310px] w-[430px] items-center justify-center overflow-hidden"
      style={{
        background:
          "radial-gradient(ellipse at 50% 20%, #f7f7f2 0%, #ebece7 70%, #e2e4df 100%)",
        fontFamily: "var(--font-sans, 'DM Sans', sans-serif)",
      }}
    >
      <div
        className="relative h-[230px] w-[398px] overflow-hidden rounded-[29px] border border-white/80"
        style={{
          background:
            "linear-gradient(132deg, rgba(191,235,250,.97) 0%, rgba(159,220,243,.96) 52%, rgba(128,203,235,.98) 100%)",
          boxShadow: "0 16px 36px rgba(65, 116, 137, .17), 0 2px 5px rgba(66, 118, 140, .08)",
        }}
      >
        <div className="absolute -right-12 -top-20 h-56 w-56 rounded-full border border-white/20" />
        <div className="absolute -right-2 -top-8 h-40 w-40 rounded-full border border-white/20" />
        <div className="absolute bottom-[-82px] left-[32%] h-40 w-80 rounded-full bg-white/15 blur-2xl" />

        <div className="relative flex h-full items-center px-[22px]">
          <div className="z-10 flex h-full w-[58%] flex-col justify-between py-[19px]">
            <div className="flex items-center justify-between pr-2">
              <span className="text-[9px] font-bold tracking-[.16em] text-[#28617a]/75">{t.time}</span>
              <span className="rounded-full border border-white/60 bg-white/40 px-2.5 py-1 text-[9px] font-semibold text-[#275b71]">
                {t.streak}
              </span>
            </div>

            <div className="mt-2">
              <div className="max-w-[190px] text-[21px] font-bold leading-[1.1] tracking-[-.04em] text-[#163f55]">
                {t.headline}
              </div>
              <div className="mt-2 text-[11px] font-medium text-[#315f72]/85">{t.detail}</div>
            </div>

            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <span className="text-[9px] font-semibold tracking-wide text-[#2d6178]/80">{t.weekday}</span>
                <span className="text-[10px] font-bold text-[#1d526b]">{t.progress}</span>
              </div>
              <div className="h-[7px] overflow-hidden rounded-full bg-white/50">
                <div
                  className="h-full w-[40%] rounded-full"
                  style={{ background: "linear-gradient(90deg, #287d9e, #24617f)" }}
                />
              </div>
              <div className="mt-2.5 flex items-center justify-between">
                <span className="text-[10px] font-semibold text-[#22566e]">{t.action}</span>
                <span className="text-[9px] text-[#3b6c7f]/70">{t.tap}</span>
              </div>
            </div>
          </div>

          <div className="absolute bottom-[-28px] right-[-50px] h-[180px] w-[180px] overflow-hidden rounded-full border border-white/30 shadow-[0_10px_24px_rgba(30,83,110,.18)]">
            <img
              src="/__mockup/images/fitbud-reference.png"
              alt="FitBud smiling in a gray athletic top"
              className="absolute inset-0 h-full w-full object-cover"
              style={{
                objectPosition: "38% 48%",
              }}
            />
          </div>
        </div>
      </div>
    </main>
  );
}
