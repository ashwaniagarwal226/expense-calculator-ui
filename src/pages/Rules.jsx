import { useEffect, useMemo, useState } from "react";
import { api, errorMessage } from "../api";
import { useProfiles } from "../profile";

const KINDS = ["EXPENSE", "INCOME", "INVESTMENT", "TRANSFER"];

export default function Rules() {
  const [categories, setCategories] = useState([]);
  const [rules, setRules] = useState([]);
  const [filter, setFilter] = useState("");
  const [notice, setNotice] = useState(null);
  const { profiles, byId, profileId } = useProfiles();
  const [rule, setRule] = useState({ keyword: "", category: "", matchType: "WORD", scope: "NARRATION", profileId: "", applyToExisting: true });
  const [cat, setCat] = useState({ code: "", displayName: "", icon: "", kind: "EXPENSE", essential: false, description: "" });

  const load = () => {
    api.categories().then(setCategories);
    api.rules(profileId).then(setRules);
  };
  useEffect(load, [profileId]);

  const names = useMemo(() => Object.fromEntries(categories.map((c) => [c.code, `${c.icon || ""} ${c.displayName}`])), [categories]);
  const shown = rules.filter((r) => !filter || r.keyword.toLowerCase().includes(filter.toLowerCase()) || r.categoryCode === filter);

  const addRule = async (e) => {
    e.preventDefault();
    try {
      const r = await api.addRule({ ...rule, profileId: rule.profileId || null });
      setNotice(`Rule "${r.rule.keyword}" added${rule.applyToExisting ? `, ${r.applied} existing transaction(s) re-categorised` : ""}.`);
      setRule({ ...rule, keyword: "" });
      load();
    } catch (err) {
      setNotice(errorMessage(err));
    }
  };

  const addCategory = async (e) => {
    e.preventDefault();
    try {
      const saved = await api.saveCategory(cat);
      setNotice(`Category ${saved.displayName} saved. Gemini will now consider it for unknown transactions.`);
      setCat({ code: "", displayName: "", icon: "", kind: "EXPENSE", essential: false, description: "" });
      load();
    } catch (err) {
      setNotice(errorMessage(err));
    }
  };

  const remove = async (r) => {
    await api.deleteRule(r.id);
    setNotice(`Rule "${r.keyword}" deleted. Use "Re-apply rules" on Transactions to update history.`);
    load();
  };

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Rules &amp; categories</h1>
          <p className="muted" style={{ margin: "4px 0 0" }}>
            Rules on your UPI note run first, then narration rules (whole word, case-insensitive; your own rules beat
            the built-in ones, longer keywords win). Anything unmatched goes to Gemini, and confident Gemini answers
            become rules marked <span className="badge AI">AI</span>.
          </p>
        </div>
      </div>
      {notice && <div className="banner">{notice}</div>}

      <section className="grid grid-2">
        <form className="card" onSubmit={addRule}>
          <h2 style={{ marginBottom: 12 }}>Add a rule</h2>
          <div className="controls">
            <input required placeholder="Keyword, e.g. DECATHLON" value={rule.keyword}
                   onChange={(e) => setRule({ ...rule, keyword: e.target.value })} />
            <select required value={rule.category} onChange={(e) => setRule({ ...rule, category: e.target.value })} aria-label="Category">
              <option value="" disabled>Category…</option>
              {categories.map((c) => <option key={c.code} value={c.code}>{c.icon} {c.displayName}</option>)}
            </select>
            <select value={rule.matchType} onChange={(e) => setRule({ ...rule, matchType: e.target.value })} aria-label="Match type">
              <option value="WORD">Whole word</option>
              <option value="REGEX">Regex</option>
            </select>
          </div>
          <div className="controls" style={{ marginTop: 10 }}>
            <select value={rule.scope} onChange={(e) => setRule({ ...rule, scope: e.target.value })} aria-label="Match against">
              <option value="NARRATION">Match anywhere in the narration</option>
              <option value="REMARK">Match only my UPI note (e.g. taxi, meds)</option>
            </select>
            {profiles.length > 1 && (
              <select value={rule.profileId} onChange={(e) => setRule({ ...rule, profileId: e.target.value })} aria-label="Applies to">
                <option value="">Everyone</option>
                {profiles.map((p) => <option key={p.id} value={p.id}>Only {p.emoji} {p.name}</option>)}
              </select>
            )}
          </div>
          <div className="controls" style={{ marginTop: 10 }}>
            <label className="check">
              <input type="checkbox" checked={rule.applyToExisting} onChange={(e) => setRule({ ...rule, applyToExisting: e.target.checked })} />
              Apply to existing transactions
            </label>
            <button className="primary" type="submit">Add rule</button>
          </div>
        </form>

        <form className="card" onSubmit={addCategory}>
          <h2 style={{ marginBottom: 12 }}>Add a category</h2>
          <div className="controls">
            <input style={{ width: 70 }} placeholder="Icon" value={cat.icon} onChange={(e) => setCat({ ...cat, icon: e.target.value })} />
            <input required placeholder="Name, e.g. Pets" value={cat.displayName}
                   onChange={(e) => setCat({ ...cat, displayName: e.target.value, code: e.target.value })} />
            <select value={cat.kind} onChange={(e) => setCat({ ...cat, kind: e.target.value })} aria-label="Kind">
              {KINDS.map((k) => <option key={k}>{k}</option>)}
            </select>
            <label className="check">
              <input type="checkbox" checked={cat.essential} onChange={(e) => setCat({ ...cat, essential: e.target.checked })} /> essential
            </label>
          </div>
          <div className="controls" style={{ marginTop: 10 }}>
            <input style={{ flex: 1 }} placeholder="Hint for Gemini, e.g. vet, pet food, Supertails" value={cat.description}
                   onChange={(e) => setCat({ ...cat, description: e.target.value })} />
            <button className="primary" type="submit">Save</button>
          </div>
        </form>
      </section>

      <section className="card">
        <div className="card-head">
          <h2>{rules.length} rules</h2>
          <div className="controls">
            <input placeholder="Filter keyword" value={filter} onChange={(e) => setFilter(e.target.value)} />
            <select value={categories.some((c) => c.code === filter) ? filter : ""} onChange={(e) => setFilter(e.target.value)} aria-label="Filter category">
              <option value="">All categories</option>
              {categories.map((c) => <option key={c.code} value={c.code}>{c.icon} {c.displayName}</option>)}
            </select>
          </div>
        </div>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Keyword</th><th>Category</th><th>Matches</th><th>Applies to</th><th>Source</th><th /></tr></thead>
            <tbody>
              {shown.map((r) => (
                <tr key={r.id}>
                  <td><code>{r.keyword}</code></td>
                  <td>{names[r.categoryCode] || r.categoryCode}</td>
                  <td className="muted">{r.scope === "REMARK" ? "UPI note" : "narration"}{r.matchType === "REGEX" ? " · regex" : ""}</td>
                  <td className="muted">{r.profileId ? `${byId[r.profileId]?.emoji || ""} ${byId[r.profileId]?.name || "?"}` : "everyone"}</td>
                  <td><span className={`badge ${r.source}`}>{r.source}</span></td>
                  <td style={{ textAlign: "right" }}><button className="ghost" onClick={() => remove(r)} aria-label={`Delete rule ${r.keyword}`}>Delete</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
