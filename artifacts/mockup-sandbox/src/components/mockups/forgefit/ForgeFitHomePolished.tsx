import { useState, type ReactNode } from "react";
import {
  ArrowRight,
  Award,
  BarChart3,
  Bell,
  Check,
  ChevronRight,
  CircleUserRound,
  Dumbbell,
  Flame,
  Home,
  Leaf,
  Plus,
  Settings,
  Sparkles,
  Target,
  Utensils,
  X,
} from "lucide-react";
import "./forgefit-home-polished.css";

type Sheet = "meal" | "settings" | null;
type Tab = "today" | "food" | "coach" | "plan" | "progress";

export function ForgeFitHomePolished() {
  // Interactive preview variant.
  const [sheet, setSheet] = useState<Sheet>(null);
  const [tab, setTab] = useState<Tab>("today");
  const [workoutDone, setWorkoutDone] = useState(false);
  const [toast, setToast] = useState("");

  const showToast = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(""), 2200);
  };

  const handleTab = (next: Tab) => {
    setTab(next);
    if (next !== "today") showToast(`${next === "food" ? "Nutrition" : next[0].toUpperCase() + next.slice(1)} view selected`);
  };

  const closeSheet = () => setSheet(null);

  return (
    <main className="forge-fit-variant">
      <div className="ff-shell">
        <header className="ff-topbar">
          <div className="ff-brand" aria-label="Forge Fit">
            <div className="ff-mark"><Sparkles size={16} strokeWidth={2.5} /></div>
            <div className="ff-wordmark">FORGE<span>FIT</span></div>
          </div>
          <div className="ff-top-actions">
            <button className="ff-icon-button" onClick={() => showToast("No new coaching notes")} aria-label="Notifications" type="button"><Bell size={17} /></button>
            <button className="ff-icon-button" onClick={() => setSheet("settings")} aria-label="Open settings" type="button"><Settings size={17} /></button>
          </div>
        </header>

        <section className="ff-intro" aria-labelledby="welcome-title">
          <div>
            <p className="ff-eyebrow">Tuesday · 17 September</p>
            <h1 className="ff-heading" id="welcome-title">Good morning,<br /><em>Sam.</em></h1>
          </div>
          <p className="ff-date">WEEK<br /><strong>38</strong> / 52</p>
        </section>

        <section className="ff-hero" aria-label="Today's calorie progress">
          <div className="ff-hero-top">
            <div>
              <p className="ff-hero-kicker">Daily fuel · on track</p>
              <p className="ff-calorie-number">1,248<small> kcal</small></p>
            </div>
            <div className="ff-ring" aria-label="63 percent of calorie target">
              <div className="ff-ring-copy"><strong>63%</strong><span>target</span></div>
            </div>
          </div>
          <div className="ff-progress-label"><span>consumed</span><span>1,980 kcal goal</span></div>
          <div className="ff-progress-track"><div className="ff-progress-fill" /></div>
          <div className="ff-hero-bottom">
            <p className="ff-remaining">remaining<strong>732 kcal</strong></p>
            <button className="ff-meal-button" onClick={() => setSheet("meal")} type="button"><Plus size={14} strokeWidth={3} /> Log a meal</button>
          </div>
        </section>

        <section aria-labelledby="macros-title">
          <div className="ff-section-head">
            <h2 className="ff-section-title" id="macros-title">Macro balance</h2>
            <button className="ff-section-link" onClick={() => handleTab("food")} type="button">See detail <ChevronRight size={11} style={{ verticalAlign: "-2px" }} /></button>
          </div>
          <div className="ff-metrics">
            <Metric icon={<Flame size={14} />} tone="blue" value="82" goal="/ 140 g" label="protein" />
            <Metric icon={<Leaf size={14} />} tone="coral" value="118" goal="/ 210 g" label="carbs" />
            <Metric icon={<Target size={14} />} tone="lime" value="41" goal="/ 62 g" label="fat" />
          </div>
        </section>

        <section aria-labelledby="workout-title">
          <div className="ff-section-head">
            <h2 className="ff-section-title" id="workout-title">Your training</h2>
            <button className="ff-section-link" onClick={() => handleTab("plan")} type="button">Full plan <ChevronRight size={11} style={{ verticalAlign: "-2px" }} /></button>
          </div>
          <div className="ff-workout-card">
            <div className="ff-workout-icon"><Dumbbell size={21} /></div>
            <div className="ff-workout-copy">
              <p className="ff-workout-kicker">{workoutDone ? "Session complete" : "Next up · 18:30"}</p>
              <h3 className="ff-workout-title">{workoutDone ? "Nice work, Sam." : "Upper body strength"}</h3>
              <p className="ff-workout-meta">{workoutDone ? "32 min · 4.8k volume" : "32 min · 6 exercises"}</p>
            </div>
            <button className={`ff-start${workoutDone ? " done" : ""}`} onClick={() => { setWorkoutDone((done) => !done); showToast(workoutDone ? "Workout moved back to plan" : "Workout marked complete"); }} aria-label={workoutDone ? "Undo workout completion" : "Complete workout"} type="button">
              {workoutDone ? <Check size={18} strokeWidth={3} /> : <ArrowRight size={18} strokeWidth={2.5} />}
            </button>
          </div>
        </section>

        <nav className="ff-bottom-nav" aria-label="Primary navigation">
          <NavButton active={tab === "today"} icon={<Home size={16} />} label="Today" onClick={() => handleTab("today")} />
          <NavButton active={tab === "food"} icon={<Utensils size={16} />} label="Food" onClick={() => handleTab("food")} />
          <NavButton active={tab === "coach"} icon={<Sparkles size={18} />} label="Coach" coach onClick={() => handleTab("coach")} />
          <NavButton active={tab === "plan"} icon={<Dumbbell size={16} />} label="Plan" onClick={() => handleTab("plan")} />
          <NavButton active={tab === "progress"} icon={<BarChart3 size={16} />} label="Progress" onClick={() => handleTab("progress")} />
        </nav>
      </div>

      {toast && <div className="ff-toast" role="status"><Award size={16} />{toast}</div>}

      {sheet && (
        <div className="ff-overlay" role="presentation" onClick={closeSheet}>
          <section className="ff-sheet" role="dialog" aria-modal="true" aria-labelledby="sheet-title" onClick={(event) => event.stopPropagation()}>
            <div className="ff-sheet-head">
              <h2 className="ff-sheet-title" id="sheet-title">{sheet === "meal" ? "Log a meal" : "Profile settings"}</h2>
              <button className="ff-sheet-close" onClick={closeSheet} aria-label="Close" type="button"><X size={17} /></button>
            </div>
            {sheet === "meal" ? (
              <>
                <div className="ff-sheet-row"><span>Breakfast</span><strong>+ Add <Plus size={14} style={{ verticalAlign: "-2px" }} /></strong></div>
                <div className="ff-sheet-row"><span>Lunch</span><strong>+ Add <Plus size={14} style={{ verticalAlign: "-2px" }} /></strong></div>
                <div className="ff-sheet-row"><span>Dinner</span><strong>+ Add <Plus size={14} style={{ verticalAlign: "-2px" }} /></strong></div>
                <button className="ff-sheet-action" onClick={() => { closeSheet(); showToast("Camera ready for meal scan"); }} type="button">Scan with camera</button>
              </>
            ) : (
              <>
                <div className="ff-sheet-row"><span>Profile</span><strong>Sam Rivera <CircleUserRound size={14} style={{ verticalAlign: "-2px", marginLeft: 4 }} /></strong></div>
                <div className="ff-sheet-row"><span>Daily target</span><strong>1,980 kcal</strong></div>
                <div className="ff-sheet-row"><span>Membership</span><strong>Forge Fit Pro</strong></div>
                <button className="ff-sheet-action" onClick={() => { closeSheet(); showToast("Preferences are up to date"); }} type="button">Save preferences</button>
              </>
            )}
          </section>
        </div>
      )}
    </main>
  );
}

function Metric({ icon, tone, value, goal, label }: { icon: ReactNode; tone: "blue" | "coral" | "lime"; value: string; goal: string; label: string }) {
  return (
    <article className="ff-metric">
      <div className="ff-metric-top"><div className={`ff-metric-icon ${tone}`}>{icon}</div></div>
      <p className="ff-metric-value">{value}<span> {goal}</span></p>
      <p className="ff-metric-label">{label}</p>
    </article>
  );
}

function NavButton({ active, icon, label, coach = false, onClick }: { active: boolean; icon: ReactNode; label: string; coach?: boolean; onClick: () => void }) {
  return <button className={`ff-nav-button${active ? " active" : ""}${coach ? " ff-coach-button" : ""}`} onClick={onClick} aria-current={active ? "page" : undefined} type="button">{icon}<span>{label}</span></button>;
}