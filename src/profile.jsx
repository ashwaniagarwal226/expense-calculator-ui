import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { api } from "./api";

export const EVERYONE = "all";
const STORAGE_KEY = "expense.profile";

const ProfileContext = createContext(null);

function readStored() {
  try {
    return localStorage.getItem(STORAGE_KEY) || EVERYONE;
  } catch {
    return EVERYONE;
  }
}

/** Holds the profile list and the selected profile ("all" = household view), remembered per browser. */
export function ProfileProvider({ children }) {
  const [profiles, setProfiles] = useState([]);
  const [selected, setSelectedState] = useState(readStored);

  const reload = useCallback(() => api.profiles().then((list) => {
    setProfiles(list);
    return list;
  }), []);

  useEffect(() => {
    reload().then((list) => {
      // single-person setups land on that person instead of "Everyone"
      setSelectedState((cur) => {
        if (cur !== EVERYONE && !list.some((p) => String(p.id) === cur)) return list.length === 1 ? String(list[0].id) : EVERYONE;
        if (cur === EVERYONE && list.length === 1) return String(list[0].id);
        return cur;
      });
    }).catch(() => setProfiles([]));
  }, [reload]);

  const setSelected = useCallback((value) => {
    setSelectedState(String(value));
    try {
      localStorage.setItem(STORAGE_KEY, String(value));
    } catch {
      /* private mode - selection just is not remembered */
    }
  }, []);

  const value = useMemo(() => {
    const current = profiles.find((p) => String(p.id) === selected) || null;
    return {
      profiles,
      reload,
      selected,
      setSelected,
      current,                                      // null when "Everyone"
      profileId: current ? current.id : undefined,  // what the API expects
      byId: Object.fromEntries(profiles.map((p) => [p.id, p])),
    };
  }, [profiles, reload, selected, setSelected]);

  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>;
}

export const useProfiles = () => useContext(ProfileContext);

export function ProfileSwitcher() {
  const { profiles, selected, setSelected } = useProfiles();
  if (profiles.length === 0) return null;
  return (
    <select className="profile-switch" value={selected} onChange={(e) => setSelected(e.target.value)} aria-label="Whose expenses">
      {profiles.length > 1 && <option value={EVERYONE}>👪 Everyone</option>}
      {profiles.map((p) => <option key={p.id} value={p.id}>{p.emoji} {p.name}</option>)}
    </select>
  );
}
