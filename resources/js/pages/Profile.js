import React, { useEffect, useState } from "react";
import axios from "../axios";
import "../../sass/Profile.scss";

const toPairs = (obj) => Object.entries(obj ?? {});
const isPlainObject = (v) => v && typeof v === "object" && !Array.isArray(v);

export default function Profile() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setErr("");
    axios
      .get("/api/user", { withCredentials: true })
      .then((res) => {
        if (!mounted) return;
        setUser(res.data);
      })
      .catch((e) => {
        if (!mounted) return;
        setErr(
          e?.response?.status === 401
            ? "You are not logged in."
            : "Unable to load profile."
        );
      })
      .finally(() => mounted && setLoading(false));
    return () => {
      mounted = false;
    };
  }, []);

  const initials =
    user?.name
      ?.split(" ")
      .map((n) => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase() || "?";

  const primaryName = user?.name || user?.username || "Account";

  // Show common fields first, then the rest
  const primaryKeys = ["id", "name", "username", "email", "role", "department", "created_at", "updated_at"];
  const shown = new Set(primaryKeys);
  const primary = primaryKeys
    .filter((k) => user && k in user)
    .map((k) => [k, user[k]]);
  const rest = toPairs(user || {}).filter(([k]) => !shown.has(k));

  return (
    <div className="profile-page">
      <div className="profile-card">
        <div className="profile-header">
          <div className="profile-avatar" aria-hidden="true">
            {user?.avatar_url ? (
              <img src={user.avatar_url} alt={`${primaryName} avatar`} />
            ) : (
              <span>{initials}</span>
            )}
          </div>
          <div className="profile-ident">
            <h1 className="profile-name">{primaryName}</h1>
            <div className="profile-sub">
              {user?.email && <span>{user.email}</span>}
              {user?.role && <span className="dot">•</span>}
              {user?.role && <span>{user.role}</span>}
            </div>
          </div>
        </div>

        {loading && <div className="profile-status">Loading profile…</div>}
        {err && <div className="profile-error">{err}</div>}

        {!loading && !err && user && (
          <>
            {primary.length > 0 && (
              <div className="profile-grid">
                {primary.map(([k, v]) => (
                  <div key={k} className="profile-field">
                    <div className="key">{k}</div>
                    <div className="val">
                      {isPlainObject(v) || Array.isArray(v) ? (
                        <pre>{JSON.stringify(v, null, 2)}</pre>
                      ) : v === null || v === undefined || v === "" ? (
                        "—"
                      ) : (
                        String(v)
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {rest.length > 0 && (
              <>
                <h2 className="section-title">All data</h2>
                <div className="profile-grid">
                  {rest.map(([k, v]) => (
                    <div key={k} className="profile-field">
                      <div className="key">{k}</div>
                      <div className="val">
                        {isPlainObject(v) || Array.isArray(v) ? (
                          <pre>{JSON.stringify(v, null, 2)}</pre>
                        ) : v === null || v === undefined || v === "" ? (
                          "—"
                        ) : (
                          String(v)
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}