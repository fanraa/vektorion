import React, { useState, useEffect } from "react";
import {
  User,
  ShieldCheck,
  Mail,
  Users,
  Star,
  Settings,
  Plus,
  Trash2,
  X,
  Save,
  Check,
} from "lucide-react";
import { cn } from "../lib/utils";
import { MaintenanceGuard } from "../components/MaintenanceGuard";
import { MEMBERS_DATA } from "../data/members";
import { collection, getDocs, doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../lib/firebase";
import { useAuth } from "../lib/AuthContext";

export interface OrgPosition {
  id: string;
  role: string;
  nim: string;
  tier: number;
}

const DEFAULT_POSITIONS: OrgPosition[] = [
  { id: "1", role: "Ketua Angkatan", nim: "125110026", tier: 1 },
  { id: "2", role: "Wakil Ketua Angkatan", nim: "125110013", tier: 2 },
  { id: "3", role: "Sekretaris I", nim: "125110031", tier: 3 },
  { id: "4", role: "Sekretaris II", nim: "125110008", tier: 3 },
  { id: "5", role: "Bendahara I", nim: "125110006", tier: 3 },
  { id: "6", role: "Bendahara II", nim: "125110005", tier: 3 },
];

interface MemberNodeProps {
  name: string;
  role: string;
  nim?: string;
  isPrimary?: boolean;
  size?: "large" | "small";
  key?: React.Key;
  photoURL?: string;
  status?: "normal" | "green" | "red";
}

const toTitleCase = (str: string) => {
  if (!str) return "";
  return str
    .toLowerCase()
    .split(" ")
    .map((word) => {
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(" ");
};

function MemberNode({
  name,
  role,
  nim,
  isPrimary,
  size = "large",
  photoURL,
  status = "normal",
}: MemberNodeProps) {
  const copyToClipboard = (text: string) => {
    if (text && text !== "-") {
      navigator.clipboard.writeText(text).catch(() => {});
    }
  };

  return (
    <div className="flex flex-col items-center select-none text-center">
      {/* Bentuk bulat (rounded-full) sesuai permintaan terbaru */}
      <div
        className={cn(
          "rounded-full border border-slate-200 shadow-sm overflow-hidden mb-3 relative bg-slate-50 flex items-center justify-center transition-all",
          status === "red"
            ? "border-red-500 ring-4 ring-red-500/20"
            : status === "green"
              ? "border-green-400 ring-4 ring-green-400/20"
              : isPrimary
                ? "border-amber-500 ring-4 ring-amber-500/10 bg-amber-50/50"
                : "border-slate-200 ring-2 ring-slate-100",
          size === "large"
            ? "w-24 h-24 flex-shrink-0"
            : "w-16 h-16 flex-shrink-0",
          isPrimary && "w-28 h-28",
        )}
      >
        {photoURL ? (
          <img
            src={photoURL}
            alt={name}
            className="w-full h-full object-cover"
          />
        ) : (
          <User
            size={size === "large" ? 36 : 24}
            className={cn("text-slate-300", isPrimary && "text-amber-400")}
          />
        )}
      </div>
      <div
        className={cn(
          "px-1 w-full flex flex-col items-center justify-start",
          size === "large" ? "min-h-[80px]" : "min-h-[64px]",
        )}
      >
        <span
          className={cn(
            "block font-medium text-amber-600 tracking-wide mb-1",
            size === "large" ? "text-[10px]" : "text-[8px]",
          )}
        >
          {role}
        </span>
        {nim && nim !== "-" && (
          <span
            onClick={(e) => {
              e.stopPropagation();
              copyToClipboard(nim);
            }}
            className="block text-[9px] font-mono text-slate-400 mb-0.5 cursor-pointer hover:text-slate-600"
          >
            {nim}
          </span>
        )}
        <h4
          onClick={(e) => {
            e.stopPropagation();
            copyToClipboard(name);
          }}
          className={cn(
            "font-bold text-slate-800 tracking-tight leading-tight uppercase cursor-pointer hover:text-slate-900 mt-0.5",
            size === "large"
              ? "text-xs md:text-sm line-clamp-2"
              : "text-[10px] line-clamp-2",
          )}
        >
          {toTitleCase(name)}
        </h4>
      </div>
    </div>
  );
}

export default function Struktur() {
  const { profile } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [syncedUsers, setSyncedUsers] = useState<Record<string, string>>({});

  const [positions, setPositions] = useState<OrgPosition[]>(DEFAULT_POSITIONS);
  const [memberStatuses, setMemberStatuses] = useState<
    Record<string, "normal" | "green" | "red">
  >({});
  const [isEditing, setIsEditing] = useState(false);
  const [editPositions, setEditPositions] = useState<OrgPosition[]>([]);
  const [editMemberStatuses, setEditMemberStatuses] = useState<
    Record<string, "normal" | "green" | "red">
  >({});
  const [isSaving, setIsSaving] = useState(false);
  const [toastMsg, setToastMsg] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch profiles
        const snap = await getDocs(collection(db, "users"));
        if (!snap.empty) {
          const profiles: Record<string, string> = {};
          snap.forEach((doc) => {
            const data = doc.data();
            if (data.nim && data.photoURL) {
              profiles[data.nim] = data.photoURL;
            }
          });
          setSyncedUsers(profiles);
        }

        // Fetch custom structure
        const structDoc = await getDoc(doc(db, "struktur_organisasi", "main"));
        if (structDoc.exists()) {
          const data = structDoc.data();
          if (data.positions) setPositions(data.positions);
          if (data.memberStatuses) setMemberStatuses(data.memberStatuses);
        }
      } catch (error) {
        console.error("Data gagal dimuat:", error);
      }
    };
    fetchData();
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await setDoc(
        doc(db, "struktur_organisasi", "main"),
        {
          positions: editPositions,
          memberStatuses: editMemberStatuses,
        },
        { merge: true },
      );
      setPositions(editPositions);
      setMemberStatuses(editMemberStatuses);
      setIsEditing(false);
      setToastMsg("Struktur berhasil diperbarui");
      setTimeout(() => setToastMsg(""), 3000);
    } catch (err) {
      console.error(err);
      alert("Gagal menyimpan struktur!");
    }
    setIsSaving(false);
  };

  // Extract NIMS used in structure to exclude them from the normal members list
  const excludedNims = positions.map((p) => p.nim);

  const filteredMembers = MEMBERS_DATA.filter((m) => {
    if (excludedNims.includes(m.nim) && m.nim !== "-") return false;
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return m.name.toLowerCase().includes(q) || m.nim.includes(q);
  });

  const tiers = Array.from(new Set(positions.map((p) => Number(p.tier)))).sort(
    (a, b) => Number(a) - Number(b),
  );

  return (
    <MaintenanceGuard menuId="struktur">
      <div className="container mx-auto px-4 py-32 space-y-24 max-w-5xl">
        {/* Header Section */}
        <div className="text-center max-w-2xl mx-auto space-y-4">
          <div className="text-amber-600 text-[10px] font-bold tracking-widest uppercase flex items-center justify-center gap-2">
            Kepengurusan Angkatan
            {profile?.isAdmin && (
              <button
                onClick={() => {
                  setEditPositions([...positions]);
                  setIsEditing(true);
                }}
                className="ml-2 px-2 py-0.5 bg-amber-100 text-amber-700 hover:bg-amber-200 rounded-sm flex items-center gap-1 transition-colors"
              >
                <Settings size={12} /> Edit
              </button>
            )}
          </div>
          <h1 className="text-3xl md:text-4xl font-black tracking-tight text-slate-900 uppercase">
            Struktur <span className="text-amber-500">Organisasi</span>
          </h1>
          <p className="text-slate-500 text-[11px] tracking-wide max-w-md mx-auto leading-relaxed">
            Sinergi dan Integritas Keluarga Besar Fisika ITERA Angkatan 2025
            (Vektorion)
          </p>
        </div>

        {/* Organizational Tree (Dynamic) */}
        <div className="flex flex-col items-center pt-10 pb-12 overflow-x-auto w-full">
          <div className="min-w-max flex flex-col items-center px-4 w-full">
            {tiers.map((tier, index) => {
              const tierMembers = positions.filter((p) => p.tier === tier);

              // Group members by base role (e.g. "Sekretaris I" and "Sekretaris II" -> "Sekretaris")
              const groupedMembers = tierMembers.reduce(
                (acc, pos) => {
                  const baseRole = pos.role
                    .replace(
                      /(?:\s+(?:I|II|III|IV|V|VI|VII|VIII|IX|X|\d+))?$/i,
                      "",
                    )
                    .trim();
                  if (!acc[baseRole]) acc[baseRole] = [];
                  acc[baseRole].push(pos);
                  return acc;
                },
                {} as Record<string, typeof tierMembers>,
              );

              const groups = Object.values(groupedMembers) as OrgPosition[][];

              return (
                <div key={tier} className="flex flex-col items-center w-full">
                  {/* Central Backbone Connection from previous tier */}
                  {index > 0 && (
                    <div className="w-[2px] h-[32px] md:h-[48px] bg-slate-200 shrink-0" />
                  )}

                  {/* Tier Groups Container */}
                  <div className="flex justify-center items-start w-full">
                    {groups.map((group, gIndex) => (
                      <div key={gIndex} className="flex flex-col items-center">
                        {/* Inter-group Connection (Branches to Groups) */}
                        {groups.length > 1 && (
                          <div className="flex flex-col items-center w-full">
                            {/* Horizontal Line Fragments */}
                            <div className="flex w-full">
                              <div
                                className={cn(
                                  "h-[2px] w-1/2",
                                  gIndex > 0 ? "bg-slate-200" : "",
                                )}
                              />
                              <div
                                className={cn(
                                  "h-[2px] w-1/2",
                                  gIndex < groups.length - 1
                                    ? "bg-slate-200"
                                    : "",
                                )}
                              />
                            </div>
                            {/* Vertical down to this group */}
                            <div className="w-[2px] h-[16px] md:h-[24px] bg-slate-200 shrink-0" />
                          </div>
                        )}

                        {/* Intra-group Container */}
                        <div className="flex flex-col md:flex-row justify-center items-center md:items-start w-full">
                          {group.map((pos, i) => {
                            const member = MEMBERS_DATA.find(
                              (m) => m.nim === pos.nim,
                            ) || { name: "Kosong (-)", nim: "-" };
                            return (
                              <React.Fragment key={pos.id}>
                                {/* Mobile Vertical Connection (for items after the first in a group) */}
                                {i > 0 && group.length > 1 && (
                                  <div className="md:hidden flex flex-col items-center">
                                    <div className="w-[2px] h-[32px] bg-slate-200 shrink-0" />
                                  </div>
                                )}

                                <div className="flex flex-col items-center w-[160px] sm:w-[180px] md:w-[240px]">
                                  {/* Desktop Intra-group Connection (Branches to Members) */}
                                  {group.length > 1 && (
                                    <div className="hidden md:flex flex-col items-center w-full">
                                      {/* Horizontal Line Fragments */}
                                      <div className="flex w-full">
                                        <div
                                          className={cn(
                                            "h-[2px] w-1/2",
                                            i > 0 ? "bg-slate-200" : "",
                                          )}
                                        />
                                        <div
                                          className={cn(
                                            "h-[2px] w-1/2",
                                            i < group.length - 1
                                              ? "bg-slate-200"
                                              : "",
                                          )}
                                        />
                                      </div>
                                      {/* Vertical down to member */}
                                      <div className="w-[2px] h-[24px] md:h-[32px] bg-slate-200 shrink-0" />
                                    </div>
                                  )}

                                  {/* Member Node Wrapper */}
                                  <div className="flex flex-col items-center w-full px-2">
                                    <MemberNode
                                      name={member.name}
                                      role={pos.role}
                                      nim={
                                        member.nim !== "-"
                                          ? member.nim
                                          : undefined
                                      }
                                      photoURL={syncedUsers[pos.nim]}
                                      status={
                                        pos.nim === "125110001" ||
                                        pos.nim === "125110014"
                                          ? "red"
                                          : memberStatuses[pos.nim] || "normal"
                                      }
                                      isPrimary={tier === 1}
                                    />
                                  </div>
                                </div>
                              </React.Fragment>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Members Section */}
        <div className="pt-16 border-t border-slate-100 space-y-12">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-extrabold text-slate-800">
                Daftar Anggota Angkatan
              </h2>
              <p className="text-[10px] text-slate-400">
                Menampilkan seluruh anggota aktif di luar barisan pengurus inti
              </p>
            </div>

            {/* Search Box */}
            <div className="relative w-full sm:w-64">
              <input
                type="text"
                placeholder="Cari anggota atau NIM..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-sm px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all font-medium"
              />
            </div>
          </div>

          {/* Grid of Members */}
          {filteredMembers.length > 0 ? (
            <div className="flex flex-wrap justify-center gap-y-12 gap-x-6 md:gap-x-12">
              {filteredMembers.map((member, idx) => (
                <div key={member.nim || idx} className="w-[85px] sm:w-[100px]">
                  <MemberNode
                    name={member.name}
                    role="Anggota"
                    nim={member.nim}
                    size="small"
                    photoURL={syncedUsers[member.nim || ""]}
                    status={
                      member.nim === "125110001" || member.nim === "125110014"
                        ? "red"
                        : memberStatuses[member.nim || ""] || "normal"
                    }
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-slate-400 text-xs">
              Tidak ada anggota yang cocok dengan pencarian Anda.
            </div>
          )}
        </div>

        {/* Edit Modal Layout */}
        {isEditing && (
          <div className="fixed inset-0 z-[1000] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
            <div className="bg-white w-full max-w-4xl max-h-[90vh] rounded-md shadow-2xl flex flex-col overflow-hidden my-auto">
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-sm bg-amber-100 flex items-center justify-center text-amber-600">
                    <Settings size={16} />
                  </div>
                  <div>
                    <h2 className="font-bold text-slate-800 text-sm">
                      Edit Kepengurusan
                    </h2>
                    <p className="text-[10px] text-slate-500">
                      Ubah peran, tambah devisi, alokasikan anggota
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsEditing(false)}
                  className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-sm transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="p-6 overflow-y-auto flex-1 bg-slate-50/50">
                <div className="space-y-8">
                  {Array.from(new Set(editPositions.map((p) => Number(p.tier))))
                    .sort((a, b) => Number(a) - Number(b))
                    .map((tier) => {
                      const tierItems = editPositions.filter(
                        (p) => p.tier === tier,
                      );
                      return (
                        <div
                          key={tier}
                          className="bg-white border border-slate-200 rounded-sm p-4 relative shadow-sm"
                        >
                          <div className="absolute -top-3 left-4 bg-slate-800 text-white text-[9px] font-bold px-2 py-0.5 rounded-sm">
                            Tier {tier}
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                            {tierItems.map((pos) => (
                              <div
                                key={pos.id}
                                className="flex gap-2 items-start border border-slate-100 p-2 rounded-sm bg-slate-50"
                              >
                                <div className="flex-1 space-y-2">
                                  <div>
                                    <label className="text-[10px] font-bold text-slate-500 block mb-1">
                                      Nama Peran / Devisi
                                    </label>
                                    <input
                                      type="text"
                                      value={pos.role}
                                      onChange={(e) =>
                                        setEditPositions((prev) =>
                                          prev.map((p) =>
                                            p.id === pos.id
                                              ? { ...p, role: e.target.value }
                                              : p,
                                          ),
                                        )
                                      }
                                      className="w-full border border-slate-200 rounded-sm px-2 py-1.5 text-xs font-medium focus:outline-none focus:border-amber-500"
                                      placeholder="Contoh: Divisi Kominfo"
                                    />
                                  </div>
                                  <div className="flex gap-2">
                                    <div className="flex-1">
                                      <label className="text-[10px] font-bold text-slate-500 block mb-1">
                                        Pilih Anggota
                                      </label>
                                      <select
                                        value={pos.nim}
                                        onChange={(e) =>
                                          setEditPositions((prev) =>
                                            prev.map((p) =>
                                              p.id === pos.id
                                                ? { ...p, nim: e.target.value }
                                                : p,
                                            ),
                                          )
                                        }
                                        className="w-full border border-slate-200 rounded-sm px-2 py-1.5 text-xs font-medium focus:outline-none focus:border-amber-500"
                                      >
                                        <option value="-">-- Kosong --</option>
                                        {MEMBERS_DATA.map((m) => (
                                          <option key={m.nim} value={m.nim}>
                                            {m.name} ({m.nim})
                                          </option>
                                        ))}
                                      </select>
                                    </div>
                                    <div className="w-16">
                                      <label className="text-[10px] font-bold text-slate-500 block mb-1">
                                        Tier
                                      </label>
                                      <input
                                        type="number"
                                        value={pos.tier}
                                        onChange={(e) =>
                                          setEditPositions((prev) =>
                                            prev.map((p) =>
                                              p.id === pos.id
                                                ? {
                                                    ...p,
                                                    tier:
                                                      parseInt(
                                                        e.target.value,
                                                      ) || 1,
                                                  }
                                                : p,
                                            ),
                                          )
                                        }
                                        className="w-full border border-slate-200 rounded-sm px-2 py-1.5 text-xs font-medium focus:outline-none focus:border-amber-500"
                                        min={1}
                                        max={10}
                                      />
                                    </div>
                                  </div>
                                </div>
                                <button
                                  onClick={() =>
                                    setEditPositions((prev) =>
                                      prev.filter((p) => p.id !== pos.id),
                                    )
                                  }
                                  className="p-2 text-red-500 hover:bg-red-50 rounded-sm mt-5 shrink-0 transition-colors"
                                  title="Hapus Posisi"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                </div>

                <button
                  onClick={() => {
                    const newTier =
                      editPositions.length > 0
                        ? Math.max(...editPositions.map((p) => p.tier)) + 1
                        : 1;
                    setEditPositions((prev) => [
                      ...prev,
                      {
                        id: Date.now().toString(),
                        role: "Devisi Baru",
                        nim: "-",
                        tier: newTier,
                      },
                    ]);
                  }}
                  className="mt-6 w-full py-3 border-2 border-dashed border-slate-300 text-slate-500 font-bold text-xs rounded-sm hover:border-amber-500 hover:text-amber-600 transition-colors flex justify-center items-center gap-2"
                >
                  <Plus size={16} /> Tambah Organisasi / Devisi Baru
                </button>

                <div className="mt-8 pt-6 border-t border-slate-200">
                  <h3 className="font-bold text-slate-800 text-sm mb-4">
                    Status Akun Anggota
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {MEMBERS_DATA.map((m) => (
                      <div
                        key={m.nim}
                        className="flex items-center justify-between p-2 border border-slate-100 rounded-sm bg-white"
                      >
                        <div className="flex flex-col w-1/2">
                          <span
                            className="text-[10px] font-bold text-slate-800 line-clamp-1"
                            title={m.name}
                          >
                            {toTitleCase(m.name)}
                          </span>
                          <span className="text-[9px] text-slate-500">
                            {m.nim}
                          </span>
                        </div>
                        <select
                          value={
                            m.nim === "125110001" || m.nim === "125110014"
                              ? "red"
                              : editMemberStatuses[m.nim] || "normal"
                          }
                          disabled={
                            m.nim === "125110001" || m.nim === "125110014"
                          }
                          onChange={(e) =>
                            setEditMemberStatuses((prev) => ({
                              ...prev,
                              [m.nim]: e.target.value as any,
                            }))
                          }
                          className={cn(
                            "text-[10px] rounded-sm border px-2 py-1 outline-none w-[100px]",
                            m.nim === "125110001" ||
                              m.nim === "125110014" ||
                              (editMemberStatuses[m.nim] || "normal") === "red"
                              ? "bg-red-50 text-red-600 border-red-200 font-bold"
                              : (editMemberStatuses[m.nim] || "normal") ===
                                  "green"
                                ? "bg-green-50 text-green-600 border-green-200 font-bold"
                                : "bg-slate-50 text-slate-600 border-slate-200",
                          )}
                        >
                          <option value="normal">Normal</option>
                          <option value="green">Hijau Muda</option>
                          <option value="red">Merah</option>
                        </select>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="p-4 border-t border-slate-100 flex justify-end shrink-0 gap-3 bg-white">
                <button
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors rounded-sm"
                >
                  Batal
                </button>
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="px-6 py-2 bg-amber-500 hover:bg-amber-600 focus:ring-4 focus:ring-amber-500/20 text-white text-xs font-bold transition-all rounded-sm flex items-center gap-2 shadow-sm disabled:opacity-50"
                >
                  {isSaving ? (
                    "Menyimpan..."
                  ) : (
                    <>
                      <Save size={14} /> Simpan Perubahan
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Toast Notif */}
        {toastMsg && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[1100] bg-white/90 backdrop-blur-md px-4 py-3 rounded-sm shadow-xl border border-slate-100 flex items-center gap-3 animate-in slide-in-from-bottom-5">
            <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center shrink-0">
              <Check size={12} className="text-green-600" />
            </div>
            <p className="text-xs font-bold text-slate-700">{toastMsg}</p>
          </div>
        )}
      </div>
    </MaintenanceGuard>
  );
}
