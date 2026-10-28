"use client";
import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

type UserRecord = {
  id: string;
  name: string | null;
  email: string;
  role: "super_admin" | "admin" | "user";
  l0Ids: string[];
  teamIds: string[];
  createdAt: string;
};

type L0 = { id: string; name: string; color: string };
type Team = { id: string; name: string; l1Id: string };
type L1 = { id: string; name: string; l0Id: string; teams: Team[] };

const ROLE_COLORS: Record<string, string> = {
  super_admin: "#7c3aed",
  admin: "#1d4ed8",
  user: "#475569",
};

function RolePill({ role }: { role: string }) {
  return (
    <span
      style={{
        display: "inline-block",
        padding: "2px 9px",
        borderRadius: 12,
        fontSize: 11,
        fontWeight: 600,
        background: ROLE_COLORS[role] + "18",
        color: ROLE_COLORS[role],
        border: `1px solid ${ROLE_COLORS[role]}40`,
        fontFamily: "var(--font-mono)",
        letterSpacing: 0.3,
      }}
    >
      {role.replace("_", " ")}
    </span>
  );
}

type EditState = {
  userId: string;
  role: string;
  l0Ids: string[];
  teamIds: string[];
};

export default function AdminUsersPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [l0s, setL0s] = useState<L0[]>([]);
  const [l1s, setL1s] = useState<L1[]>([]);
  const [loading, setLoading] = useState(true);
  const [edit, setEdit] = useState<EditState | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [addEmail, setAddEmail] = useState("");
  const [addRole, setAddRole] = useState("user");
  const [addL0Ids, setAddL0Ids] = useState<string[]>([]);
  const [addTeamIds, setAddTeamIds] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isSuperAdmin = session?.user?.role === "super_admin";
  const isAdmin = session?.user?.role === "admin" || isSuperAdmin;

  const fetchUsers = useCallback(async () => {
    const res = await fetch("/api/admin/users");
    if (res.ok) {
      const data = await res.json();
      setUsers(data);
    }
  }, []);

  useEffect(() => {
    if (status === "loading") return;
    if (!session || !isAdmin) {
      router.replace("/plan");
      return;
    }
    const load = async () => {
      setLoading(true);
      try {
        const [usersRes, hierarchyRes] = await Promise.all([
          fetch("/api/admin/users"),
          fetch("/api/hierarchy"),
        ]);
        if (usersRes.ok) setUsers(await usersRes.json());
        if (hierarchyRes.ok) {
          // hierarchy returns L0[] with nested l1s and teams
          const rawL0s: Array<L0 & { l1s: Array<L1 & { teams: Team[] }> }> = await hierarchyRes.json();
          setL0s(rawL0s.map(({ id, name, color }) => ({ id, name, color })));
          setL1s(
            rawL0s.flatMap((l0) =>
              (l0.l1s ?? []).map((l1) => ({
                id: l1.id,
                name: l1.name,
                l0Id: l0.id,
                teams: l1.teams ?? [],
              }))
            )
          );
        }
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [status, session, isAdmin, router]);

  // All teams from l1s
  const allTeams: Team[] = l1s.flatMap((l1) => l1.teams ?? []);

  // Get teams belonging to given l0Ids
  const teamsForL0s = (selectedL0Ids: string[]) => {
    const validL1Ids = l1s.filter((l1) => selectedL0Ids.includes(l1.l0Id)).map((l1) => l1.id);
    return allTeams.filter((t) => validL1Ids.includes(t.l1Id));
  };

  const startEdit = (u: UserRecord) => {
    setEdit({ userId: u.id, role: u.role, l0Ids: [...u.l0Ids], teamIds: [...u.teamIds] });
    setError(null);
  };

  const saveEdit = async () => {
    if (!edit) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/users/${edit.userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: edit.role, l0Ids: edit.l0Ids, teamIds: edit.teamIds }),
      });
      if (!res.ok) {
        const d = await res.json();
        setError(d.error ?? "Save failed");
        return;
      }
      await fetchUsers();
      setEdit(null);
    } finally {
      setSaving(false);
    }
  };

  const deleteUser = async (id: string) => {
    if (!confirm("Delete this user? This cannot be undone.")) return;
    const res = await fetch(`/api/admin/users/${id}`, { method: "DELETE" });
    if (res.ok) {
      await fetchUsers();
    } else {
      const d = await res.json();
      alert(d.error ?? "Delete failed");
    }
  };

  const addUser = async () => {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: addEmail.trim(), role: addRole, l0Ids: addL0Ids, teamIds: addTeamIds }),
      });
      if (!res.ok) {
        const d = await res.json();
        setError(d.error ?? "Add failed");
        return;
      }
      await fetchUsers();
      setAddOpen(false);
      setAddEmail("");
      setAddRole("user");
      setAddL0Ids([]);
      setAddTeamIds([]);
    } finally {
      setSaving(false);
    }
  };

  const toggleArr = (arr: string[], val: string): string[] =>
    arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val];

  if (status === "loading" || loading) {
    return (
      <div style={{ padding: 48, color: "#94a3b8", fontFamily: "var(--font-sans)", fontSize: 14 }}>
        Loading...
      </div>
    );
  }

  if (!session || !isAdmin) return null;

  const callerL0Ids = session.user.l0Ids ?? [];
  const availableL0s = isSuperAdmin ? l0s : l0s.filter((l) => callerL0Ids.includes(l.id));
  const availableRoles = isSuperAdmin ? ["user", "admin", "super_admin"] : ["user"];

  return (
    <div style={{ padding: "32px 40px", fontFamily: "var(--font-sans)", color: "#0f172a", maxWidth: 1100 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28 }}>
        <div>
          <button
            onClick={() => router.push("/inbox")}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              fontSize: 13,
              color: "#64748b",
              fontFamily: "var(--font-sans)",
              padding: 0,
              marginBottom: 8,
            }}
          >
            ← Inbox
          </button>
          <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0, color: "#0f172a" }}>User Management</h1>
          <p style={{ fontSize: 13, color: "#64748b", margin: "4px 0 0" }}>
            {users.length} user{users.length !== 1 ? "s" : ""}
          </p>
        </div>
        <button
          onClick={() => { setAddOpen(true); setError(null); }}
          style={{
            padding: "8px 18px",
            borderRadius: 9,
            background: "#1d4ed8",
            color: "#fff",
            border: "none",
            cursor: "pointer",
            fontSize: 13,
            fontWeight: 600,
            fontFamily: "var(--font-sans)",
          }}
        >
          + Add User
        </button>
      </div>

      {/* Table */}
      <div style={{ border: "1px solid #e2e8f0", borderRadius: 9, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
              {["Name", "Email", "Role", "L0s", "Teams", "Actions"].map((h) => (
                <th
                  key={h}
                  style={{
                    padding: "10px 16px",
                    textAlign: "left",
                    fontWeight: 600,
                    fontSize: 11,
                    color: "#475569",
                    letterSpacing: 0.5,
                    textTransform: "uppercase",
                    whiteSpace: "nowrap",
                  }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {users.map((u, i) => {
              const userL0Names = l0s.filter((l) => u.l0Ids.includes(l.id)).map((l) => l.name);
              const userTeamNames = allTeams.filter((t) => u.teamIds.includes(t.id)).map((t) => t.name);
              const isEditing = edit?.userId === u.id;

              return (
                <tr
                  key={u.id}
                  style={{
                    borderBottom: i < users.length - 1 ? "1px solid #e2e8f0" : "none",
                    background: isEditing ? "#f0f9ff" : "transparent",
                  }}
                >
                  <td style={{ padding: "12px 16px", fontWeight: 500 }}>
                    {u.name ?? <span style={{ color: "#94a3b8" }}>—</span>}
                  </td>
                  <td style={{ padding: "12px 16px", color: "#475569" }}>{u.email}</td>
                  <td style={{ padding: "12px 16px" }}>
                    {isEditing ? (
                      <select
                        value={edit.role}
                        onChange={(e) => setEdit({ ...edit, role: e.target.value, l0Ids: [], teamIds: [] })}
                        style={{ fontSize: 12, borderRadius: 6, border: "1px solid #e2e8f0", padding: "3px 8px", fontFamily: "var(--font-sans)" }}
                      >
                        {availableRoles.map((r) => (
                          <option key={r} value={r}>{r.replace("_", " ")}</option>
                        ))}
                      </select>
                    ) : (
                      <RolePill role={u.role} />
                    )}
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    {isEditing && (edit.role === "admin" || edit.role === "super_admin") ? (
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                        {availableL0s.map((l) => (
                          <label key={l.id} style={{ display: "flex", alignItems: "center", gap: 4, cursor: "pointer", fontSize: 12 }}>
                            <input
                              type="checkbox"
                              checked={edit.l0Ids.includes(l.id)}
                              onChange={() => setEdit({ ...edit, l0Ids: toggleArr(edit.l0Ids, l.id) })}
                            />
                            {l.name}
                          </label>
                        ))}
                      </div>
                    ) : (
                      <span style={{ color: userL0Names.length ? "#0f172a" : "#94a3b8", fontSize: 12 }}>
                        {userL0Names.length ? userL0Names.join(", ") : "—"}
                      </span>
                    )}
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    {isEditing && edit.role === "user" ? (
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 4, maxWidth: 280 }}>
                        {teamsForL0s(availableL0s.map((l) => l.id)).map((t) => (
                          <label key={t.id} style={{ display: "flex", alignItems: "center", gap: 4, cursor: "pointer", fontSize: 12 }}>
                            <input
                              type="checkbox"
                              checked={edit.teamIds.includes(t.id)}
                              onChange={() => setEdit({ ...edit, teamIds: toggleArr(edit.teamIds, t.id) })}
                            />
                            {t.name}
                          </label>
                        ))}
                      </div>
                    ) : (
                      <span style={{ color: userTeamNames.length ? "#0f172a" : "#94a3b8", fontSize: 12 }}>
                        {userTeamNames.length ? userTeamNames.join(", ") : "—"}
                      </span>
                    )}
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      {isEditing ? (
                        <>
                          <button
                            onClick={saveEdit}
                            disabled={saving}
                            style={{
                              padding: "4px 12px",
                              borderRadius: 6,
                              background: "#1d4ed8",
                              color: "#fff",
                              border: "none",
                              cursor: "pointer",
                              fontSize: 12,
                              fontWeight: 600,
                              fontFamily: "var(--font-sans)",
                              opacity: saving ? 0.6 : 1,
                            }}
                          >
                            {saving ? "Saving…" : "Save"}
                          </button>
                          <button
                            onClick={() => { setEdit(null); setError(null); }}
                            style={{
                              padding: "4px 10px",
                              borderRadius: 6,
                              background: "transparent",
                              color: "#64748b",
                              border: "1px solid #e2e8f0",
                              cursor: "pointer",
                              fontSize: 12,
                              fontFamily: "var(--font-sans)",
                            }}
                          >
                            Cancel
                          </button>
                        </>
                      ) : (
                        <>
                          {(isSuperAdmin || (isAdmin && u.role !== "super_admin" && u.role !== "admin")) && (
                            <button
                              onClick={() => startEdit(u)}
                              style={{
                                padding: "4px 12px",
                                borderRadius: 6,
                                background: "transparent",
                                color: "#1d4ed8",
                                border: "1px solid #bfdbfe",
                                cursor: "pointer",
                                fontSize: 12,
                                fontFamily: "var(--font-sans)",
                              }}
                            >
                              Edit
                            </button>
                          )}
                          {isSuperAdmin && u.id !== session.user.id && (
                            <button
                              onClick={() => deleteUser(u.id)}
                              style={{
                                padding: "4px 10px",
                                borderRadius: 6,
                                background: "transparent",
                                color: "#dc2626",
                                border: "1px solid #fecaca",
                                cursor: "pointer",
                                fontSize: 12,
                                fontFamily: "var(--font-sans)",
                              }}
                            >
                              Delete
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {error && (
        <div style={{ marginTop: 12, color: "#dc2626", fontSize: 13, background: "#fef2f2", padding: "8px 12px", borderRadius: 7, border: "1px solid #fecaca" }}>
          {error}
        </div>
      )}

      {/* Add User Modal */}
      {addOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15,23,42,0.35)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 100,
          }}
          onClick={(e) => { if (e.target === e.currentTarget) setAddOpen(false); }}
        >
          <div
            style={{
              background: "#fff",
              borderRadius: 12,
              padding: 28,
              width: 480,
              boxShadow: "0 20px 60px rgba(0,0,0,0.15)",
              fontFamily: "var(--font-sans)",
            }}
          >
            <h2 style={{ margin: "0 0 20px", fontSize: 17, fontWeight: 700, color: "#0f172a" }}>Add / Invite User</h2>

            <label style={{ display: "block", marginBottom: 14 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: "#475569", marginBottom: 5 }}>Email</div>
              <input
                type="email"
                value={addEmail}
                onChange={(e) => setAddEmail(e.target.value)}
                placeholder="user@example.com"
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  border: "1px solid #e2e8f0",
                  borderRadius: 7,
                  fontSize: 13,
                  fontFamily: "var(--font-sans)",
                  boxSizing: "border-box",
                  color: "#0f172a",
                }}
              />
            </label>

            <label style={{ display: "block", marginBottom: 14 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: "#475569", marginBottom: 5 }}>Role</div>
              <select
                value={addRole}
                onChange={(e) => { setAddRole(e.target.value); setAddL0Ids([]); setAddTeamIds([]); }}
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  border: "1px solid #e2e8f0",
                  borderRadius: 7,
                  fontSize: 13,
                  fontFamily: "var(--font-sans)",
                  color: "#0f172a",
                }}
              >
                {availableRoles.map((r) => (
                  <option key={r} value={r}>{r.replace("_", " ")}</option>
                ))}
              </select>
            </label>

            {(addRole === "admin" || addRole === "super_admin") && (
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: "#475569", marginBottom: 5 }}>Assign L0s</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {availableL0s.map((l) => (
                    <label key={l.id} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 13, cursor: "pointer" }}>
                      <input
                        type="checkbox"
                        checked={addL0Ids.includes(l.id)}
                        onChange={() => setAddL0Ids(toggleArr(addL0Ids, l.id))}
                      />
                      {l.name}
                    </label>
                  ))}
                </div>
              </div>
            )}

            {addRole === "user" && (
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: "#475569", marginBottom: 5 }}>Assign Teams</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8, maxHeight: 160, overflowY: "auto" }}>
                  {teamsForL0s(availableL0s.map((l) => l.id)).map((t) => (
                    <label key={t.id} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 13, cursor: "pointer" }}>
                      <input
                        type="checkbox"
                        checked={addTeamIds.includes(t.id)}
                        onChange={() => setAddTeamIds(toggleArr(addTeamIds, t.id))}
                      />
                      {t.name}
                    </label>
                  ))}
                </div>
              </div>
            )}

            {error && (
              <div style={{ color: "#dc2626", fontSize: 13, background: "#fef2f2", padding: "7px 11px", borderRadius: 6, border: "1px solid #fecaca", marginBottom: 14 }}>
                {error}
              </div>
            )}

            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 8 }}>
              <button
                onClick={() => { setAddOpen(false); setError(null); }}
                style={{
                  padding: "8px 16px",
                  borderRadius: 7,
                  background: "transparent",
                  color: "#475569",
                  border: "1px solid #e2e8f0",
                  cursor: "pointer",
                  fontSize: 13,
                  fontFamily: "var(--font-sans)",
                }}
              >
                Cancel
              </button>
              <button
                onClick={addUser}
                disabled={saving || !addEmail.trim()}
                style={{
                  padding: "8px 18px",
                  borderRadius: 7,
                  background: "#1d4ed8",
                  color: "#fff",
                  border: "none",
                  cursor: saving || !addEmail.trim() ? "not-allowed" : "pointer",
                  fontSize: 13,
                  fontWeight: 600,
                  fontFamily: "var(--font-sans)",
                  opacity: saving || !addEmail.trim() ? 0.6 : 1,
                }}
              >
                {saving ? "Adding…" : "Add User"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
