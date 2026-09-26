import { useState, type ReactNode } from "react";
import "./forgefit-ledger.css";

type IconName = "settings" | "badge" | "flame" | "camera" | "arrow" | "barbell" | "chevron" | "home" | "plate" | "chart" | "person" | "close" | "check" | "plus";

function Icon({ name, size = 18 }: { name: IconName; size?: number }) {
  const common = { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, "aria-hidden": true as const };
  const paths: Record<IconName, ReactNode> = {
    settings: <><circle cx="12" cy="12" r="3" /><path d="m19.4 15 .1.1a1.7 1.7 0 0 1-2.4 2.4l-.1-.1a1.7 1.7 0 0 0-2.9 1.2v.3a1.7 1.7 0 0 1-3.4 0v-.2a1.7 1.7 0 0 0-2.9-1.2l-.1.1a1.7 1.7 0 0 1-2.4-2.4l.1-.1a1.7 1.7 0 0 0-1.2-2.9h-.3a1.7 1.7 0 0 1 0-3.4h.2a1.7 1.7 0 0 0 1.2-2.9l-.1-.1a1.7 1.7 0 0 1 2.4-2.4l.1.1a1.7 1.7 0 0 0 2.9-1.2v-.3a1.7 1.7 0 0 1 3.4 0v.2a1.7 1.7 0 0 0 2.9 1.2l.1-.1a1.7 1.7 0 0 1 2.4 2.4l-.1.1a1.7 1.7 0 0 0 1.2 2.9h.3a1.7 1.7 0 0 1 0 3.4h-.2a1.7 1.7 0 0 0-1.2 2.9Z" /></>,
    badge: <><path d="m12 3 2.3 1.3 2.6.1.8 2.4 1.8 1.9-.7 2.5.7 2.5-1.8 1.9-.8 2.4-2.6.1L12 20l-2.3-1.3-2.6-.1-.8-2.4-1.8-1.9.7-2.5-.7-2.5 1.8-1.9.8-2.4 2.6-.1L12 3Z" /><path d="m9 12 2 2 4-4" /></>,
    flame: <><path d="M12 22c4 0 7-3 7-7 0-3-2-5-4-7 0 2-1 3-2 4 0-4-2-7-5-9 1 5-3 7-3 12 0 4 3 7 7 7Z" /><path d="M12 22c2 0 3-1 3-3 0-2-2-4-3-5-1 2-3 3-3 5 0 2 1 3 3 3Z" /></>,
    camera: <><path d="M14 5h-4L8.5 7H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3.5L14 5Z" /><circle cx="12" cy="13" r="3.5" /></>,
    arrow: <><path d="M5 12h14" /><path d="m13 6 6 6-6 6" /></>,
    barbell: <><path d="M6 7v10M3.5 9v6M18 7v10m2.5-8v6M6 12h12" /></>,
    chevron: <path d="m9 18 6-6-6-6" />,
    home: <><path d="m3 10 9-7 9 7" /><path d="M5 9v11h14V9M9 20v-6h6v6" /></>,
    plate: <><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="5" /><path d="M12 3v4" /></>,
    chart: <><path d="M4 19V5M4 19h17" /><path d="m7 15 4-4 3 2 6-7" /></>,
    person: <><circle cx="12" cy="8" r="3.5" /><path d="M4.5 21v-1.5a7.5 7.5 0 0 1 15 0V21" /></>,
    close: <><path d="m6 6 12 12M18 6 6 18" /></>,
    check: <path d="m5 12 4 4L19 6" />,
    plus: <><path d="M12 5v14M5 12h14" /></>,
  };
  return <svg {...common}>{paths[name]}</svg>;
}

const macroData = [
  { name: "Protein", consumed: 92, goal: 160, color: "var(--ice)" },
  { name: "Carbs", consumed: 138, goal: 220, color: "var(--tangerine)" },
  { name: "Fat", consumed: 42, goal: 70, color: "var(--iris)" },
];

export default function ForgeFitLedger() {
  const [dialog, setDialog] = useState<"meal" | "settings" | "badge" | null>(null);
  const [workoutStarted, setWorkoutStarted] = useState(false);
  const [weightOpen, setWeightOpen] = useState(false);
  const [weight, setWeight] = useState("");
  const [weightSaved, setWeightSaved] = useState(false);
  const [activeTab, setActiveTab] = useState("Today");
  const [notice, setNotice] = useState("");

  const selectTab = (tab: string) => {
    setActiveTab(tab);
    if (tab !== "Today") {
      setNotice(`${tab} overview selected`);
      window.setTimeout(() => setNotice(""), 1900);
    }
  };

  return (
    <main className="ledger-shell">
      <div className="ledger-scroll">
        <header className="ledger-topbar">
          <div className="ledger-brand">
            <span className="ledger-mark"><Icon name="barbell" size={19} /></span>
            <span className="ledger-wordmark">GAIN<span>MODE</span></span>
          </div>
          <button className="ledger-icon-button" aria-label="Open settings" onClick={() => setDialog("settings")}><Icon name="settings" size={18} /></button>
        </header>

        <section className="ledger-intro">
          <div>
            <p className="ledger-date">TUESDAY · MAY 21</p>
            <h1>Good morning,<br /><span>Alex.</span></h1>
          </div>
          <div className="ledger-streak"><span className="streak-flame"><Icon name="flame" size={16} /></span><strong>6</strong><span>day<br />streak</span></div>
        </section>

        <section className="ledger-intake" aria-label="Daily calorie progress">
          <div className="intake-heading">
            <div className="ledger-eyebrow"><span className="eyebrow-dot" /> DAILY INTAKE</div>
            <button className="badge-chip" onClick={() => setDialog("badge")}><Icon name="badge" size={14} /> Iron habit</button>
          </div>
          <div className="intake-main">
            <div className="intake-total">
              <span className="intake-label">Calories</span>
              <div className="intake-number">1,284</div>
              <div className="intake-target">of <b>2,100</b> kcal</div>
            </div>
            <div className="calorie-orbit" role="img" aria-label="61 percent of calorie goal">
              <svg viewBox="0 0 110 110" aria-hidden="true">
                <circle className="orbit-track" cx="55" cy="55" r="47" />
                <circle className="orbit-progress" cx="55" cy="55" r="47" />
              </svg>
              <div className="orbit-copy"><strong>61%</strong><span>GOAL</span></div>
            </div>
          </div>
          <div className="intake-foot">
            <div><span className="foot-label">REMAINING</span><strong>816 <small>kcal</small></strong></div>
            <div className="intake-status"><span className="status-dot" /> On track</div>
          </div>
          <button className="meal-action" onClick={() => setDialog("meal")}><span className="meal-icon"><Icon name="camera" size={16} /></span><span>Analyze a meal photo</span><Icon name="arrow" size={16} /></button>
        </section>

        <section className="macro-ledger">
          <div className="section-heading">
            <div><p className="ledger-kicker">THE DETAILS</p><h2>Macro balance</h2></div>
            <span className="macro-unit">GRAMS</span>
          </div>
          <div className="macro-rows">
            {macroData.map((macro) => (
              <div className="macro-row" key={macro.name}>
                <div className="macro-name"><span className="macro-key" style={{ background: macro.color }} />{macro.name}</div>
                <div className="macro-track"><span style={{ width: `${(macro.consumed / macro.goal) * 100}%`, background: macro.color }} /></div>
                <div className="macro-value"><b>{macro.consumed}</b><span> / {macro.goal}</span></div>
              </div>
            ))}
          </div>
        </section>

        <section className="workout-section">
          <div className="section-heading workout-heading">
            <div><p className="ledger-kicker">ON THE PLAN</p><h2>Today’s workout</h2></div>
            <button className="view-plan" onClick={() => { setNotice("Weekly plan opened"); window.setTimeout(() => setNotice(""), 1900); }}>Full plan <Icon name="chevron" size={13} /></button>
          </div>
          <div className="workout-card">
            <div className="workout-art"><span className="art-ring art-ring-one" /><span className="art-ring art-ring-two" /><span className="art-number">A<span>1</span></span><Icon name="barbell" size={26} /></div>
            <div className="workout-info"><span className="workout-tag">UPPER BODY</span><h3>Push strength</h3><p>45 min <i /> 6 exercises</p></div>
            <button className={`workout-launch ${workoutStarted ? "is-started" : ""}`} onClick={() => setWorkoutStarted(!workoutStarted)} aria-label={workoutStarted ? "Finish workout" : "Start workout"}>
              <Icon name={workoutStarted ? "check" : "arrow"} size={18} />
            </button>
            {workoutStarted && <div className="workout-progress"><span>SESSION IN PROGRESS</span><b>00:01</b></div>}
          </div>
        </section>

        <section className={`weight-card ${weightOpen ? "weight-expanded" : ""}`}>
          <span className="weight-symbol"><Icon name="chart" size={18} /></span>
          <div className="weight-content"><span className="weight-label">BODY WEIGHT</span><strong>{weightSaved && weight ? `${weight} kg` : "Log today’s weight"}</strong></div>
          <button className="weight-add" aria-label="Add today's weight" onClick={() => { setWeightOpen(!weightOpen); setWeightSaved(false); }}><Icon name={weightOpen ? "close" : "plus"} size={17} /></button>
          {weightOpen && <form className="weight-form" onSubmit={(event) => { event.preventDefault(); if (weight.trim()) { setWeightSaved(true); setWeightOpen(false); } }}>
            <label htmlFor="weight-entry">Today’s weight</label><div><input id="weight-entry" type="number" inputMode="decimal" step="0.1" placeholder="72.4" value={weight} onChange={(event) => setWeight(event.target.value)} required /><span>kg</span><button type="submit">Save</button></div>
          </form>}
        </section>
        <div className="ledger-bottom-space" />
      </div>

      <nav className="ledger-tabs" aria-label="Main navigation">
        {[{ label: "Today", icon: "home" as const }, { label: "Food", icon: "plate" as const }, { label: "Progress", icon: "chart" as const }, { label: "Profile", icon: "person" as const }].map((tab) => (
          <button key={tab.label} className={`tab-item ${activeTab === tab.label ? "tab-active" : ""}`} onClick={() => selectTab(tab.label)} aria-current={activeTab === tab.label ? "page" : undefined}>
            <Icon name={tab.icon} size={19} /><span>{tab.label}</span>
          </button>
        ))}
      </nav>

      {notice && <div className="ledger-toast" role="status">{notice}</div>}
      {dialog && <div className="ledger-modal-backdrop" onClick={() => setDialog(null)}>
        <section className="ledger-modal" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
          <button className="modal-close" aria-label="Close" onClick={() => setDialog(null)}><Icon name="close" size={17} /></button>
          <span className="modal-emblem"><Icon name={dialog === "meal" ? "camera" : dialog === "badge" ? "badge" : "settings"} size={22} /></span>
          <p className="ledger-kicker">{dialog === "meal" ? "MEAL JOURNAL" : dialog === "badge" ? "YOUR MILESTONE" : "PREFERENCES"}</p>
          <h2>{dialog === "meal" ? "A clearer picture." : dialog === "badge" ? "Iron habit" : "Make it yours."}</h2>
          <p>{dialog === "meal" ? "Photo analysis is ready. Choose a meal image to estimate calories and macros." : dialog === "badge" ? "You’ve shown up consistently. Keep the streak moving and this badge stays yours." : "Your profile, language and training preferences live here."}</p>
          {dialog === "meal" ? <button className="modal-primary" onClick={() => setDialog(null)}><Icon name="camera" size={16} /> Choose a photo</button> : <button className="modal-primary" onClick={() => setDialog(null)}>Got it <Icon name="arrow" size={16} /></button>}
        </section>
      </div>}
    </main>
  );
}