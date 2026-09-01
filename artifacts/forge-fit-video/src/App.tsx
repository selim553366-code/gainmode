import React, { useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useVideoPlayer } from "@/lib/video";

const SCENE_DURATIONS = {
  hook: 4000,
  transform: 4000,
  meal: 5000,
  goals: 4000,
  workout: 6000,
  coach: 4000,
  end: 3000,
} as const;
const SCENE_STARTS = [0, 4, 8, 13, 17, 23, 27];
const TOTAL = 30;
const BASE = import.meta.env.BASE_URL;
const asset = (name: string) => `${BASE}assets/${name}`;

function SceneShell({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <motion.section className={`scene ${className}`} initial={{ clipPath: "polygon(100% 0, 100% 0, 100% 100%, 100% 100%)", opacity: .6 }} animate={{ clipPath: "polygon(0 0, 100% 0, 100% 100%, 0 100%)", opacity: 1 }} exit={{ clipPath: "polygon(0 0, 0 0, 0 100%, 0 100%)", opacity: .7 }} transition={{ duration: .72, ease: [0.16, 1, 0.3, 1] }}>{children}</motion.section>;
}

function Phone({ screen }: { screen: "meal" | "goals" }) {
  return <div className="phone">
    <div className="phone-screen">
      <div className="app-head"><div className="app-head__mark"><img src={asset("forge-fit-logo.jpeg")} alt="" /> FORGE FIT</div><span>12:41</span></div>
      {screen === "meal" ? <>
        <div className="meal-image"><img src={asset("forge-fit-meal.png")} alt="" /><div className="scan-line" /></div>
        <div className="analysis-card">
          <div className="analysis-card__row"><span>Fotoğraf analizi</span><span>Hazır</span></div>
          <div className="analysis-card__cal">638 <small>kcal</small></div>
          <div className="macro-row"><div className="macro"><b>42g</b>protein</div><div className="macro"><b>61g</b>karbonhidrat</div><div className="macro"><b>18g</b>yağ</div></div>
        </div>
      </> : <div className="goal-sheet" style={{ position: "relative", inset: "auto", top: "8%", right: "auto", width: "100%", transform: "rotate(-2deg)" }}>
        <div className="goal-sheet__top"><span>GÜNLÜK HEDEF</span><b>Bugün</b></div><div className="goal-number"><strong>2.145</strong><span>kcal</span></div><div className="goal-bar"><i /></div><div className="goal-macros"><div className="goal-macro"><small>PROTEİN</small><b>142 g</b></div><div className="goal-macro"><small>KARB.</small><b>231 g</b></div><div className="goal-macro"><small>YAĞ</small><b>68 g</b></div></div><div className="goal-note">Forge Fit, hedefini ve ritmini birlikte ayarlar.</div>
      </div>}
    </div>
  </div>;
}

function App() {
  const { currentScene } = useVideoPlayer({ durations: SCENE_DURATIONS });
  const audioRef = useRef<HTMLAudioElement>(null);
  const scene = currentScene;
  const elapsed = SCENE_STARTS[scene] ?? 0;
  const progress = elapsed / TOTAL;
  const orb = scene === 0 ? { x: "68%", y: "15%", scale: 1.35 } : scene === 1 ? { x: "90%", y: "34%", scale: .82 } : scene === 2 ? { x: "24%", y: "70%", scale: .68 } : scene === 3 ? { x: "10%", y: "30%", scale: 1.1 } : scene === 4 ? { x: "82%", y: "73%", scale: .88 } : scene === 5 ? { x: "24%", y: "24%", scale: 1.2 } : { x: "50%", y: "38%", scale: 1.45 };

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = 0;
    void audio.play().catch(() => {
      // Browser autoplay policies may require a user gesture in preview.
    });
    return () => {
      audio.pause();
      audio.currentTime = 0;
    };
  }, []);

  return <main className="video-canvas">
    <audio
      ref={audioRef}
      className="audio-track"
      src={`${BASE}audio/bg_music.mp3`}
      preload="auto"
      autoPlay
      loop
      aria-label="Arka plan müziği"
    />
    <div className="ambient-grid" />
    <motion.div className="glow-orb" animate={orb} transition={{ duration: 1.4, ease: [0.16, 1, .3, 1] }} />
    <motion.div className="camera-ring" animate={{ rotate: [0, 8, -5, 0], scale: scene === 0 ? 1.1 : .8, opacity: scene === 6 ? .9 : .45 }} transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }} />
    <header className="brand-ribbon">
      <div className="brand-ribbon__left"><img src={asset("forge-fit-logo.jpeg")} alt="Forge Fit" /><div><div className="brand-name">FORGE FIT</div><div className="brand-kicker">kendin için</div></div></div>
      <div className="timecode">00:{String(Math.floor(elapsed)).padStart(2, "0")} / 00:30</div>
    </header>
    <div className="progress-rail"><motion.div className="progress-fill" style={{ scaleX: progress }} /></div>
    <div className="floating-chip chip-a">#KENDİ RİTMİN</div>
    <div className="floating-chip chip-b">HEDEF • ODAK • İSTİKRAR</div>
    <div className="floating-chip chip-c">FITBUD ONLINE</div>
    <div className="scene-layer">
      <AnimatePresence mode="sync" initial={false}>
        {scene === 0 && <SceneShell key="hook" className="hook">
          <div className="hook-photo"><img src={asset("forge-fit-influencer-before.png")} alt="Forge Fit kullanıcısı başlangıçta" /></div>
          <div className="selfie-frame"><span>●</span> SELFIE / 01<br />bugün başlıyorum</div>
          <div className="eyebrow">Gerçek bir yolculuk / @mertfit</div>
          <h1 className="display hook-title">Bu kez<br /><em>kendim için.</em></h1>
          <p className="body-copy hook-sub">“Ne yiyeceğimi, ne yapacağımı bilmiyordum. Sonra her şeyi tek yerde toplamayı denedim.”</p>
        </SceneShell>}
        {scene === 1 && <SceneShell key="transform" className="split-scene">
          <div className="copy"><div className="eyebrow">4 ay • küçük kararlar</div><h2 className="display split-title">Mükemmel<br />değil.<br /><span>istikrarlı.</span></h2><p className="body-copy">Bu bir vaat değil. Bir kullanıcının, kendi temposunda sürdürdüğü motivasyonlu bir süreç.</p></div>
          <div className="before-after"><div className="before-after__half"><img src={asset("forge-fit-influencer-before.png")} alt="" /></div><div className="before-after__full"><img src={asset("forge-fit-influencer-after.png")} alt="" /></div><div className="divider" /><div className="tag tag--before">başlangıç</div><div className="tag tag--after">şimdi / daha güçlü</div></div>
        </SceneShell>}
        {scene === 2 && <SceneShell key="meal" className="demo-scene">
          <div className="eyebrow">01 / öğününü yakala</div><h2 className="display demo-title">Fotoğrafını çek.<br /><strong>Ne aldığını bil.</strong></h2><p className="body-copy demo-sub">Forge Fit tabağını analiz eder, kalori ve makroları saniyeler içinde gösterir.</p><Phone screen="meal" />
        </SceneShell>}
        {scene === 3 && <SceneShell key="goals" className="goals-scene">
          <div className="goals-copy"><div className="eyebrow">02 / sana göre ayarla</div><h2 className="display goals-title">Hedefin<br />ekranda<br /><span style={{ color: "#7bd3fa" }}>netleşsin.</span></h2><p className="body-copy" style={{ maxWidth: "58%" }}>Kişisel günlük kalori ve makro hedefleri. Sadece bugünün için.</p></div>
          <div className="goal-sheet"><div className="goal-sheet__top"><span>GÜNLÜK HEDEF</span><b>Salı</b></div><div className="goal-number"><strong>2.145</strong><span>kcal</span></div><div className="goal-bar"><i /></div><div className="goal-macros"><div className="goal-macro"><small>PROTEİN</small><b>142 g</b></div><div className="goal-macro"><small>KARB.</small><b>231 g</b></div><div className="goal-macro"><small>YAĞ</small><b>68 g</b></div></div><div className="goal-note">Hedefler, profilin ve ilerleme ritminle birlikte güncellenir.</div></div>
        </SceneShell>}
        {scene === 4 && <SceneShell key="workout" className="workout-scene">
          <div className="eyebrow">03 / planını uygula</div><h2 className="display workout-title">Bugün ne<br />var? <span>Hazır.</span></h2><p className="body-copy" style={{ maxWidth: "58%" }}>Sana göre hazırlanmış antrenman. Bittiğinde işaretle, ritmini gör.</p>
          <div className="reference-screen"><img src={asset("forge-fit-dashboard.png")} alt="Forge Fit uygulama ekranı" /></div><div className="workout-list"><div className="exercise"><div className="exercise__icon">↗</div><div className="exercise__name">Goblet squat</div><div className="exercise__reps">3 × 12</div><div className="exercise__check">✓</div></div><div className="exercise"><div className="exercise__icon">↗</div><div className="exercise__name">Incline push-up</div><div className="exercise__reps">3 × 10</div><div className="exercise__check">✓</div></div><div className="exercise"><div className="exercise__icon">↗</div><div className="exercise__name">Dumbbell row</div><div className="exercise__reps">3 × 12</div><div className="exercise__check">✓</div></div></div>
        </SceneShell>}
        {scene === 5 && <SceneShell key="coach" className="coach-scene">
          <div className="eyebrow">04 / yalnız değilsin</div><h2 className="display coach-title">Takıldığında<br /><em>FitBud’a sor.</em></h2><p className="body-copy" style={{ maxWidth: "64%" }}>Motive eden, planına göre cevap veren yapay zekâ koçun.</p>
          <div className="coach-card"><div className="coach-card__header"><img src={asset("coach-wave-direct.jpg")} alt="FitBud" /><div><b>FitBud</b><small>kişisel AI koçun</small></div></div><div className="coach-message"><strong>Bugün için fikrim:</strong><br />Antrenmandan önce 20 g protein hedefle. Kolay olsun: yoğurt + muz. Devam edelim mi?</div><div className="coach-dots"><i /><i /><i /></div></div>
        </SceneShell>}
        {scene === 6 && <SceneShell key="end" className="end-scene">
          <div className="logo-lock"><img src={asset("forge-fit-logo.jpeg")} alt="Forge Fit" /></div><h2 className="display end-title">KENDİ<br /><span>RİTMİNİ</span><br />KUR.</h2><div className="end-tag">Forge Fit · bugün başla, kendin için sürdür</div><p className="disclaimer">Sonuçlar kişiye göre değişir. Bu hikâye bir kullanıcının motivasyonlu yolculuğudur; tıbbi öneri veya garanti değildir.</p>
        </SceneShell>}
      </AnimatePresence>
    </div>
  </main>;
}

export default App;