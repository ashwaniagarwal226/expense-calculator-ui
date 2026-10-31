import { useEffect, useState } from "react";
import { api, errorMessage, money } from "../api";
import { useProfiles } from "../profile";

function TipCard({ tip }) {
  const current = Number(tip.currentMonthlySpend || 0);
  const budget = Number(tip.suggestedMonthlyBudget || 0);
  const saving = Number(tip.potentialMonthlySaving || 0);
  const total = Math.max(current, budget + saving) || 1;
  return (
    <article className="card tip">
      <div className="card-head" style={{ marginBottom: 0 }}>
        <h3>{tip.title}</h3>
        {tip.difficulty && <span className="diff">{tip.difficulty.toLowerCase()}</span>}
      </div>
      <div className="save num">save {money(saving)}<span className="muted" style={{ fontSize: "0.8rem", fontWeight: 500 }}> / month</span></div>
      <p className="ink2" style={{ margin: 0 }}>{tip.detail}</p>
      {current > 0 && (
        <>
          <div className="bar" role="img" aria-label={`Budget ${money(budget)}, saving ${money(saving)}`}>
            <div style={{ width: `${(budget / total) * 100}%`, background: "var(--series-1)" }} />
            <div style={{ width: `${(saving / total) * 100}%`, background: "var(--good)" }} />
          </div>
          <div className="legend" style={{ marginTop: 0 }}>
            <span><i style={{ background: "var(--series-1)" }} />Suggested budget {money(budget)}</span>
            <span><i style={{ background: "var(--good)" }} />Saving {money(saving)}</span>
            <span className="muted">now {money(current)}</span>
          </div>
        </>
      )}
    </article>
  );
}

export default function SaveMore({ ai }) {
  const [months, setMonths] = useState(3);
  const [advice, setAdvice] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const { profileId, current } = useProfiles();

  useEffect(() => { setAdvice(null); }, [profileId]);

  const analyse = async (refresh = false) => {
    setBusy(true);
    setError(null);
    try {
      setAdvice(await api.savings(profileId, months, refresh));
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Where can {current ? (current.name === "Me" ? "I" : current.name) : "we"} save more?</h1>
          <p className="muted" style={{ margin: "4px 0 0" }}>
            {ai?.enabled
              ? `Gemini (${ai.model}) reviews category totals, top merchants and recurring payments. Raw narrations are not sent.`
              : "Gemini is off - you will get rule-based suggestions. Set GEMINI_API_KEY on the backend for AI advice."}
          </p>
        </div>
        <div className="controls">
          <select value={months} onChange={(e) => setMonths(Number(e.target.value))} aria-label="Months to analyse">
            <option value={1}>Last month</option>
            <option value={3}>Last 3 months</option>
            <option value={6}>Last 6 months</option>
            <option value={12}>Last 12 months</option>
          </select>
          <button className="primary" onClick={() => analyse(false)} disabled={busy}>
            {busy ? <span className="spinner" /> : "✨"} Analyse
          </button>
          {advice?.source === "GEMINI" && <button onClick={() => analyse(true)} disabled={busy}>Regenerate</button>}
        </div>
      </div>

      {error && <div className="banner error">{error}</div>}
      {busy && !advice && <div className="card empty"><span className="spinner" /> <span className="ink2">Thinking about your spending…</span></div>}
      {!advice && !busy && (
        <div className="card empty">
          <h2>Get a personalised savings plan</h2>
          <p className="muted">Pick a period and press Analyse.</p>
        </div>
      )}

      {advice && (
        <>
          {advice.notice && <div className="banner">{advice.notice}</div>}
          <section className="grid grid-kpi">
            <div className="card kpi hero">
              <div className="label">Potential savings</div>
              <div className="value num" style={{ color: "var(--good)" }}>{money(advice.estimatedMonthlySavings)}<span className="muted" style={{ fontSize: "0.9rem" }}> /mo</span></div>
              <div className="sub">{money(Number(advice.estimatedMonthlySavings) * 12)} a year</div>
            </div>
            <div className="card kpi">
              <div className="label">Avg monthly income</div>
              <div className="value num">{money(advice.avgMonthlyIncome)}</div>
            </div>
            <div className="card kpi">
              <div className="label">Avg monthly expenses</div>
              <div className="value num">{money(advice.avgMonthlyExpenses)}</div>
            </div>
            <div className="card kpi">
              <div className="label">Analysed</div>
              <div className="value num">{advice.monthsAnalyzed} mo</div>
              <div className="sub">{advice.source === "GEMINI" ? `by ${advice.model}` : "rule-based"}</div>
            </div>
          </section>

          <section className="card">
            <h2 style={{ marginBottom: 8 }}>Summary</h2>
            <p className="ink2" style={{ margin: 0 }}>{advice.summary}</p>
          </section>

          <section className="grid grid-2">
            {advice.tips.map((t, i) => <TipCard key={i} tip={t} />)}
          </section>

          {advice.quickWins?.length > 0 && (
            <section className="card">
              <h2 style={{ marginBottom: 8 }}>Quick wins</h2>
              <ul className="list">
                {advice.quickWins.map((w, i) => <li key={i}><span>✅ {w}</span></li>)}
              </ul>
            </section>
          )}
        </>
      )}
    </>
  );
}
