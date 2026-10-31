import { useState } from "react";
import { api, errorMessage } from "../api";
import { useProfiles } from "../profile";

const EMOJIS = ["🙂", "👨", "👩", "👵", "👴", "👦", "👧", "🧑", "🏠"];

function ProfileRow({ profile, onChanged, setNotice, isLast }) {
  const [name, setName] = useState(profile.name);
  const [emoji, setEmoji] = useState(profile.emoji);
  const [confirming, setConfirming] = useState(false);
  const dirty = name !== profile.name || emoji !== profile.emoji;

  const save = async () => {
    try {
      await api.updateProfile(profile.id, { name, emoji });
      setNotice(`Saved ${name}.`);
      onChanged();
    } catch (e) {
      setNotice(errorMessage(e));
    }
  };

  const remove = async () => {
    try {
      const r = await api.deleteProfile(profile.id);
      setNotice(`Deleted ${profile.name} and ${r.transactionsDeleted} transaction(s).`);
      onChanged();
    } catch (e) {
      setNotice(errorMessage(e));
    }
    setConfirming(false);
  };

  return (
    <li>
      <div className="controls" style={{ flex: 1 }}>
        <select value={emoji} onChange={(e) => setEmoji(e.target.value)} aria-label="Emoji">
          {[...new Set([emoji, ...EMOJIS])].map((e) => <option key={e}>{e}</option>)}
        </select>
        <input value={name} onChange={(e) => setName(e.target.value)} aria-label="Name" />
        <span className="muted">{profile.transactionCount} transactions</span>
      </div>
      <div className="controls">
        {dirty && <button className="primary" onClick={save}>Save</button>}
        {!isLast && !confirming && <button className="ghost" onClick={() => setConfirming(true)}>Delete</button>}
        {confirming && (
          <>
            <span className="up">Delete {profile.name} and all their transactions?</span>
            <button className="danger" onClick={remove}>Yes, delete</button>
            <button onClick={() => setConfirming(false)}>Cancel</button>
          </>
        )}
      </div>
    </li>
  );
}

export default function Profiles() {
  const { profiles, reload, setSelected } = useProfiles();
  const [notice, setNotice] = useState(null);
  const [name, setName] = useState("");
  const [emoji, setEmoji] = useState("👩");

  const add = async (e) => {
    e.preventDefault();
    try {
      const p = await api.createProfile({ name, emoji });
      setNotice(`Added ${p.name}. Upload their statement from the dashboard with "${p.name}" selected.`);
      setName("");
      await reload();
      setSelected(p.id);
    } catch (err) {
      setNotice(errorMessage(err));
    }
  };

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Profiles</h1>
          <p className="muted" style={{ margin: "4px 0 0" }}>
            One profile per person (you, your wife, your mom…). Each statement is uploaded to a profile; switch
            between people or pick “Everyone” for the household view in the top bar. Rules you create by
            “remembering” a transaction only apply to that person.
          </p>
        </div>
      </div>
      {notice && <div className="banner">{notice}</div>}

      <form className="card" onSubmit={add}>
        <h2 style={{ marginBottom: 12 }}>Add a person</h2>
        <div className="controls">
          <select value={emoji} onChange={(e) => setEmoji(e.target.value)} aria-label="Emoji">
            {EMOJIS.map((e) => <option key={e}>{e}</option>)}
          </select>
          <input required placeholder="Name, e.g. Mom" value={name} onChange={(e) => setName(e.target.value)} />
          <button className="primary" type="submit">Add profile</button>
        </div>
      </form>

      <section className="card">
        <h2 style={{ marginBottom: 8 }}>{profiles.length} {profiles.length === 1 ? "person" : "people"}</h2>
        <ul className="list profiles">
          {profiles.map((p) => (
            <ProfileRow key={`${p.id}-${p.name}-${p.emoji}-${p.transactionCount}`} profile={p} onChanged={reload}
                        setNotice={setNotice} isLast={profiles.length === 1} />
          ))}
        </ul>
      </section>
    </>
  );
}
