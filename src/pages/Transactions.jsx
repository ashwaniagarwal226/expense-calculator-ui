import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { api, errorMessage, money } from "../api";
import { useProfiles } from "../profile";

const PAGE_SIZE = 50;
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function CategoryCell({ txn, categories, onSaved }) {
  const [value, setValue] = useState(txn.category);
  const [remember, setRemember] = useState(false);
  const [rememberBy, setRememberBy] = useState(txn.remark ? "REMARK" : "NARRATION");
  const [busy, setBusy] = useState(false);
  const dirty = value !== txn.category;

  const save = async () => {
    setBusy(true);
    try {
      const r = await api.setCategory(txn.id, { category: value, createRule: remember, ruleScope: rememberBy });
      onSaved(r);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="controls" style={{ gap: 6 }}>
      <select value={value} onChange={(e) => setValue(e.target.value)} aria-label="Category">
        {categories.map((c) => <option key={c.code} value={c.code}>{c.icon} {c.displayName}</option>)}
      </select>
      {dirty && (
        <>
          <label className="check" title="Create a rule and apply it to similar transactions of this person">
            <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} /> remember
          </label>
          {remember && txn.remark && (
            <select value={rememberBy} onChange={(e) => setRememberBy(e.target.value)} aria-label="Remember by">
              <option value="REMARK">for note “{txn.remark}”</option>
              <option value="NARRATION">for {txn.merchant}</option>
            </select>
          )}
          <button className="primary" onClick={save} disabled={busy}>Save</button>
        </>
      )}
    </div>
  );
}

export default function Transactions({ ai }) {
  const [params, setParams] = useSearchParams();
  const { profileId, current, profiles, byId } = useProfiles();
  const showPerson = !current && profiles.length > 1;
  const [data, setData] = useState(null);
  const [categories, setCategories] = useState([]);
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null);
  const [busy, setBusy] = useState(false);
  const [q, setQ] = useState(params.get("q") || "");

  const filters = {
    year: params.get("year") || "",
    month: params.get("month") || "",
    category: params.get("category") || "",
    uncategorized: params.get("uncategorized") === "true",
    q: params.get("q") || "",
    page: Number(params.get("page") || 0),
  };

  const setFilter = (key, value) => {
    const next = new URLSearchParams(params);
    if (value === "" || value === false || value === null) next.delete(key); else next.set(key, value);
    if (key !== "page") next.delete("page");
    setParams(next);
  };

  const load = useCallback(() => {
    api.transactions({
      profileId,
      year: filters.year || undefined,
      month: filters.year && filters.month ? filters.month : undefined,
      category: filters.category || undefined,
      uncategorized: filters.uncategorized,
      q: filters.q || undefined,
      page: filters.page,
      size: PAGE_SIZE,
    }).then((d) => { setData(d); setError(null); }).catch((e) => setError(errorMessage(e)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params, profileId]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { api.categories().then(setCategories); }, []);

  const recategorize = async (useAi) => {
    setBusy(true);
    setNotice(null);
    try {
      const r = await api.recategorize(profileId, useAi);
      setNotice(`Checked ${r.examined} transactions: ${r.ruleCategorized} matched rules, ${r.aiCategorized} categorised by Gemini, ${r.stillUncategorized} still uncategorised.${r.aiError ? " Gemini: " + r.aiError : ""}`);
      load();
    } catch (e) {
      setNotice(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  const onSaved = (r) => {
    setNotice(r.ruleId
      ? `Saved. Rule created and applied to ${r.otherTransactionsUpdated} other transaction(s).`
      : "Saved.");
    load();
  };

  const thisYear = new Date().getFullYear();
  const years = Array.from({ length: 6 }, (_, i) => thisYear - i);
  const pages = data ? Math.ceil(data.total / PAGE_SIZE) : 0;

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Transactions{current ? ` · ${current.emoji} ${current.name}` : ""}</h1>
          <p className="muted" style={{ margin: "4px 0 0" }}>
            Fix a category once and tick “remember” to create a rule for that merchant or UPI note.
            Notes you type in your UPI app (“taxi”, “meds”) show as <span className="note">TAXI</span> and are matched first.
          </p>
        </div>
        <div className="controls">
          <button onClick={() => recategorize(false)} disabled={busy}>Re-apply rules</button>
          <button className="primary" onClick={() => recategorize(true)} disabled={busy || !ai?.enabled}
                  title={ai?.enabled ? "Send uncategorised transactions to Gemini" : ai?.hint}>
            {busy ? <span className="spinner" /> : "✨"} Categorise unknown with Gemini
          </button>
        </div>
      </div>

      {notice && <div className="banner">{notice}</div>}
      {error && <div className="banner error">{error}</div>}

      <section className="card">
        <div className="controls" style={{ marginBottom: 12 }}>
          <select value={filters.year} onChange={(e) => setFilter("year", e.target.value)} aria-label="Year">
            <option value="">All years</option>
            {years.map((y) => <option key={y}>{y}</option>)}
          </select>
          <select value={filters.month} onChange={(e) => setFilter("month", e.target.value)} disabled={!filters.year} aria-label="Month">
            <option value="">All months</option>
            {MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
          </select>
          <select value={filters.category} onChange={(e) => setFilter("category", e.target.value)} aria-label="Category">
            <option value="">All categories</option>
            {categories.map((c) => <option key={c.code} value={c.code}>{c.icon} {c.displayName}</option>)}
          </select>
          <form onSubmit={(e) => { e.preventDefault(); setFilter("q", q); }} className="controls">
            <input placeholder="Search merchant, note, narration" value={q} onChange={(e) => setQ(e.target.value)} />
          </form>
          <label className="check">
            <input type="checkbox" checked={filters.uncategorized} onChange={(e) => setFilter("uncategorized", e.target.checked)} />
            Only uncategorised
          </label>
          {data && <span className="muted">{data.total} results</span>}
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                {showPerson && <th>Who</th>}
                <th>Merchant</th>
                <th>Category</th>
                <th>Source</th>
                <th className="amount">Debit</th>
                <th className="amount">Credit</th>
              </tr>
            </thead>
            <tbody>
              {data?.items.map((t) => (
                <tr key={t.id}>
                  <td className="num" style={{ whiteSpace: "nowrap" }}>{t.date}<div className="muted">{t.bank}</div></td>
                  {showPerson && <td className="person">{byId[t.profileId]?.emoji} {byId[t.profileId]?.name}</td>}
                  <td>{t.merchant}{t.remark && <span className="note" title="Your UPI note">📝 {t.remark}</span>}<div className="narr">{t.narration}</div></td>
                  <td><CategoryCell key={`${t.id}-${t.category}`} txn={t} categories={categories} onSaved={onSaved} /></td>
                  <td><span className={`badge ${t.categorySource}`}>{t.categorySource === "NONE" ? "unmatched" : t.categorySource}</span></td>
                  <td className="amount">{t.withdrawal ? money(t.withdrawal) : ""}</td>
                  <td className="amount down">{t.deposit ? money(t.deposit) : ""}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {data && data.items.length === 0 && <p className="muted" style={{ textAlign: "center" }}>No transactions match these filters.</p>}
        {pages > 1 && (
          <div className="pager">
            <button onClick={() => setFilter("page", filters.page - 1)} disabled={filters.page === 0}>← Newer</button>
            <span className="muted">Page {filters.page + 1} of {pages}</span>
            <button onClick={() => setFilter("page", filters.page + 1)} disabled={filters.page >= pages - 1}>Older →</button>
          </div>
        )}
      </section>
    </>
  );
}
