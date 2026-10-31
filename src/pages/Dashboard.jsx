import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api, compact, errorMessage, money, pct } from "../api";
import UploadCard from "../components/UploadCard";
import { CategoryBars, SplitMeter, TrendChart, WeekdayChart } from "../components/charts";
import { useProfiles } from "../profile";

const plural = (n, word) => `${n} ${word}${n === 1 ? "" : "s"}`;

function Delta({ value, invert = false }) {
  if (value === null || value === undefined) return <span className="muted">no previous month</span>;
  const up = value > 0;
  const good = invert ? up : !up;
  return (
    <span className={good ? "down" : "up"}>
      {up ? "▲" : "▼"} {pct(Math.abs(value))} vs last month
    </span>
  );
}

function Kpi({ label, value, sub, hero }) {
  return (
    <div className={`card kpi ${hero ? "hero" : ""}`}>
      <div className="label">{label}</div>
      <div className="value num">{value}</div>
      {sub && <div className="sub">{sub}</div>}
    </div>
  );
}

export default function Dashboard({ ai }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [bank, setBank] = useState("");
  const [index, setIndex] = useState(0);
  const [selectedCat, setSelectedCat] = useState(null);
  const navigate = useNavigate();
  const { profileId, current, profiles, reload: reloadProfiles } = useProfiles();

  const load = useCallback(() => {
    api.insights(profileId, bank).then((d) => { setData(d); setError(null); }).catch((e) => setError(errorMessage(e)));
  }, [bank, profileId]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { setIndex(0); setSelectedCat(null); }, [bank, profileId]);
  const onImported = () => { load(); reloadProfiles(); };

  const months = data?.months || [];
  const m = months[index];
  const overall = data?.overall;

  const categoryDrill = useMemo(() => m?.categories.find((c) => c.code === selectedCat), [m, selectedCat]);

  if (error) {
    return (
      <>
        <UploadCard onImported={onImported} />
        <p className="banner error">Could not load insights: {error}. Is the backend running on port 8081?</p>
      </>
    );
  }

  return (
    <>
      <UploadCard onImported={onImported} />

      {data && months.length === 0 && (
        <div className="card empty">
          <h2>No transactions yet{current ? ` for ${current.name}` : ""}</h2>
          <p className="muted">Upload a statement from HDFC, ICICI, SBI, Axis or Kotak to see your insights.</p>
        </div>
      )}

      {m && (
        <>
          <section className="card month-nav">
            <button onClick={() => setIndex(index + 1)} disabled={index >= months.length - 1}>← Prev</button>
            <div className="title">
              <strong>{m.label}</strong>
              <span>{m.year} · {current ? `${current.emoji} ${current.name}` : "👪 Everyone"}</span>
            </div>
            <div className="controls" style={{ justifyContent: "flex-end" }}>
              {overall.banks.length > 1 && (
                <select value={bank} onChange={(e) => setBank(e.target.value)} aria-label="Bank">
                  <option value="">All banks</option>
                  {overall.banks.map((b) => <option key={b}>{b}</option>)}
                </select>
              )}
              <button onClick={() => setIndex(index - 1)} disabled={index === 0}>Next →</button>
            </div>
          </section>

          {m.uncategorizedCount > 0 && (
            <div className="banner">
              <b>{m.uncategorizedCount}</b> transactions this month are uncategorised.{" "}
              <Link to={`/transactions?year=${m.year}&month=${m.month}&uncategorized=true`}>Review them</Link>
              {ai?.enabled ? " or let Gemini categorise them from the Transactions page." : "."}
            </div>
          )}

          <section className="grid grid-kpi">
            <Kpi hero label="Total spent" value={money(m.totalSpent)} sub={<Delta value={m.spentChangePct} />} />
            <Kpi label="Income" value={money(m.income)} sub={`Net ${money(m.net)}`} />
            <Kpi label="Savings rate" value={pct(m.savingsRate)}
                 sub={overall.avgSavingsRate != null ? `avg ${pct(overall.avgSavingsRate)} over ${overall.monthsCovered} months` : null} />
            <Kpi label="Invested" value={money(m.invested)} sub="counted as saved" />
            <Kpi label="Daily average" value={money(m.avgDailySpend)} sub="expenses ÷ days" />
            <Kpi label="Transactions" value={m.transactionCount} sub={`${m.categories.length} categories`} />
          </section>

          {!current && profiles.length > 1 && m.byProfile.length > 0 && (
            <section className="card">
              <div className="card-head">
                <h2>Who spent what</h2>
                <span className="muted">{m.label} · pick a person in the top bar to see only their numbers</span>
              </div>
              <SplitMeter parts={m.byProfile.slice(0, 4).map((p, i) => ({
                label: `${p.emoji} ${p.name}`, value: Number(p.spent), token: `--series-${i + 1}`,
              }))} />
              {m.byProfile.length > 4 && <p className="muted">+ {m.byProfile.length - 4} more people</p>}
            </section>
          )}

          <section className="card">
            <div className="card-head">
              <h2>Needs vs wants</h2>
              <span className="muted">expenses only, excludes investments &amp; transfers</span>
            </div>
            <SplitMeter parts={[
              { label: "Essential", value: Number(m.essential), token: "--series-3" },
              { label: "Discretionary", value: Number(m.discretionary), token: "--series-4" },
            ]} />
          </section>

          <section className="grid grid-2">
            <div className="card">
              <div className="card-head">
                <h2>Where the money went</h2>
                <span className="muted">click a bar for details</span>
              </div>
              <CategoryBars data={m.categories} selected={selectedCat}
                            onSelect={(code) => setSelectedCat(code === selectedCat ? null : code)} />
              {categoryDrill && (
                <div className="banner" style={{ marginTop: 8 }}>
                  {categoryDrill.icon} <b>{categoryDrill.name}</b>: {money(categoryDrill.amount)} across {plural(categoryDrill.count, "payment")}
                  {categoryDrill.previousAmount != null && <> (last month {money(categoryDrill.previousAmount)})</>}.{" "}
                  <button className="link" onClick={() => navigate(`/transactions?year=${m.year}&month=${m.month}&category=${categoryDrill.code}`)}>
                    See transactions →
                  </button>
                </div>
              )}
            </div>
            <div className="card">
              <div className="card-head">
                <h2>Expenses vs income</h2>
                <span className="muted">last 12 months</span>
              </div>
              <TrendChart months={months} onSelect={setIndex} />
            </div>
          </section>

          <section className="card">
            <div className="card-head"><h2>Categories this month</h2><span className="muted">change vs previous month</span></div>
            <div className="tiles">
              {m.categories.map((c) => (
                <div className="tile" key={c.code}>
                  <button onClick={() => navigate(`/transactions?year=${m.year}&month=${m.month}&category=${c.code}`)}>
                    <div className="top">
                      <span className="icon" aria-hidden>{c.icon}</span>
                      <span className="share">{pct(c.share, 1)}</span>
                    </div>
                    <div className="name">{c.name}</div>
                    <div className="amount num">{money(c.amount)}</div>
                    <div className="delta">
                      {c.changePct == null ? <span className="muted">{plural(c.count, "payment")}</span>
                        : <span className={c.changePct > 0 ? "up" : "down"}>{c.changePct > 0 ? "▲" : "▼"} {pct(Math.abs(c.changePct))} · {plural(c.count, "payment")}</span>}
                    </div>
                  </button>
                </div>
              ))}
            </div>
          </section>

          <section className="grid grid-2">
            <div className="card">
              <div className="card-head"><h2>Top merchants</h2><span className="muted">{m.label}</span></div>
              <ul className="list">
                {m.topMerchants.map((t) => (
                  <li key={t.merchant}>
                    <span className="main">{t.merchant}</span>
                    <span className="side"><b className="num">{money(t.amount)}</b> <span className="muted">· {t.count}×</span></span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="card">
              <div className="card-head"><h2>Spending by weekday</h2><span className="muted">{m.label}</span></div>
              <WeekdayChart values={m.weekdaySpend} />
            </div>
          </section>

          <section className="grid grid-2">
            <div className="card">
              <div className="card-head"><h2>Biggest payments</h2><span className="muted">{m.label}</span></div>
              <ul className="list">
                {m.largestTransactions.map((t) => (
                  <li key={t.id}>
                    <span className="main">{t.categoryIcon} {t.merchant} <span className="muted">· {t.date}</span></span>
                    <b className="side num">{money(t.withdrawal)}</b>
                  </li>
                ))}
              </ul>
            </div>
            <div className="card">
              <div className="card-head">
                <h2>Recurring payments</h2>
                <span className="muted">paid in 3+ months at a similar amount</span>
              </div>
              {overall.recurring.length === 0 ? <p className="muted">Nothing recurring detected yet.</p> : (
                <ul className="list">
                  {overall.recurring.map((r) => (
                    <li key={r.merchant}>
                      <span className="main">{r.merchant} <span className="muted">· {r.categoryName} · {r.monthsSeen} months</span></span>
                      <span className="side"><b className="num">{money(r.avgAmount)}</b><span className="muted">/mo · {compact(r.estimatedYearly)}/yr</span></span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>

          <section className="card" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
            <div>
              <h2>Find places to save</h2>
              <p className="muted" style={{ margin: "4px 0 0" }}>Gemini reviews your recent months and suggests concrete cuts with amounts.</p>
            </div>
            <button className="primary" onClick={() => navigate("/save")}>Analyse my spending →</button>
          </section>
        </>
      )}
    </>
  );
}
