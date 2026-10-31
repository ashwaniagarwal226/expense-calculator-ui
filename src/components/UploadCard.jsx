import { useEffect, useState } from "react";
import { FileUploader } from "react-drag-drop-files";
import { api, errorMessage } from "../api";
import { useProfiles } from "../profile";

const FILE_TYPES = ["xls", "xlsx", "csv"];

export default function UploadCard({ onImported }) {
  const [banks, setBanks] = useState([]);
  const [bank, setBank] = useState("AUTO");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const { profiles, current } = useProfiles();
  const [owner, setOwner] = useState("");

  // default the owner to whoever is selected in the top bar
  useEffect(() => {
    setOwner(current ? String(current.id) : profiles[0] ? String(profiles[0].id) : "");
  }, [current, profiles]);

  useEffect(() => {
    api.banks().then(setBanks).catch(() => setBanks([]));
  }, []);

  const handleFile = async (file) => {
    setBusy(true);
    setError(null);
    setResult(null);
    try {
      const r = await api.upload(file, bank, owner || undefined);
      setResult(r);
      onImported?.(r);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="card">
      <div className="card-head">
        <h2>Upload a bank statement</h2>
        <span className="muted">Excel (.xls, .xlsx) or CSV</span>
      </div>
      <div className="upload">
        {profiles.length > 1 && (
          <label className="controls">
            <span className="ink2">Whose</span>
            <select value={owner} onChange={(e) => setOwner(e.target.value)} disabled={busy}>
              {profiles.map((p) => <option key={p.id} value={p.id}>{p.emoji} {p.name}</option>)}
            </select>
          </label>
        )}
        <label className="controls">
          <span className="ink2">Bank</span>
          <select value={bank} onChange={(e) => setBank(e.target.value)} disabled={busy}>
            <option value="AUTO">Detect automatically</option>
            {banks.map((b) => <option key={b.code} value={b.code}>{b.displayName}</option>)}
          </select>
        </label>
        <div className="dropzone">
          <FileUploader handleChange={handleFile} name="file" types={FILE_TYPES} disabled={busy}
                        label="Drop your statement here or click to browse" />
        </div>
      </div>
      {busy && <p className="ink2"><span className="spinner" /> Importing and categorising… unknown merchants are sent to Gemini, this can take a few seconds.</p>}
      {error && <p className="banner error">{error}</p>}
      {result && (
        <div className="banner ok" style={{ marginTop: 12 }}>
          <div><b>{result.fileName}</b>: {result.message}{result.bankAutoDetected ? " (detected automatically)" : ""}</div>
          <div className="upload-stats">
            <span><b>{result.inserted}</b> new</span>
            <span><b>{result.updated}</b> updated</span>
            <span><b>{result.ruleCategorized}</b> by rules</span>
            <span><b>{result.aiCategorized}</b> by Gemini</span>
            <span><b>{result.uncategorized}</b> uncategorised</span>
          </div>
          {result.aiError && <div className="muted" style={{ marginTop: 6 }}>Gemini: {result.aiError}</div>}
        </div>
      )}
    </section>
  );
}
