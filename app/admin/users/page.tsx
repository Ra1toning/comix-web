'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  getAllUsersForAdmin,
  extendUserSubscription,
  UserForAdmin,
} from '@/lib/services/firebase-admin';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { UserAvatar } from '@/components/shared/UserAvatar';
import {
  AdminPageHeader,
  AdminPageTransition,
  AdminPanel,
  AdminPanelHeader,
  AdminTable,
  StatusChip,
} from '@/components/admin/AdminUI';
import {
  Users as UsersIcon,
  Search,
  BadgeCheck,
  CalendarPlus,
  X,
  Loader2,
} from 'lucide-react';

const EXTEND_PRESETS = [30, 90, 180];

const displayNameOf = (user: UserForAdmin) =>
  user.displayName || user.name || 'Нэргүй хэрэглэгч';

const formatDate = (value?: { toDate?: () => Date }) => {
  const date = value?.toDate?.();
  return date ? date.toLocaleDateString('mn-MN') : '—';
};

/** Идэвхтэй эрхтэй бол үлдсэн хоног, дуусах огноог буцаана. */
const activeSubscription = (user: UserForAdmin) => {
  const sub = user.subscription;
  const expires = sub?.expiresAt?.toDate?.();
  if (sub?.status === 'active' && expires && expires.getTime() > Date.now()) {
    return {
      plan: String(sub.plan || 'plus').toUpperCase(),
      daysLeft: Math.max(1, Math.ceil((expires.getTime() - Date.now()) / 86400000)),
      expires,
    };
  }
  return null;
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserForAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const [extendTarget, setExtendTarget] = useState<UserForAdmin | null>(null);
  const [extendDays, setExtendDays] = useState(30);
  const [extending, setExtending] = useState(false);
  const [extendError, setExtendError] = useState('');
  const [notice, setNotice] = useState('');

  useEffect(() => {
    getAllUsersForAdmin()
      .then(setUsers)
      .catch((error) => {
        console.error('Error fetching users:', error);
        setLoadError(true);
      })
      .finally(() => setLoading(false));
  }, []);

  const filteredUsers = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return users;

    const numericTerm = term.replace(/^#/, '');
    const isIdSearch = /^\d+$/.test(numericTerm);

    return users.filter((user) => {
      if (isIdSearch && user.lumioId != null) {
        if (String(user.lumioId).startsWith(numericTerm)) return true;
      }
      return (
        displayNameOf(user).toLowerCase().includes(term) ||
        user.email?.toLowerCase().includes(term)
      );
    });
  }, [searchTerm, users]);

  const openExtend = (user: UserForAdmin) => {
    setExtendTarget(user);
    setExtendDays(30);
    setExtendError('');
    setNotice('');
  };

  const handleExtend = async () => {
    if (!extendTarget) return;
    setExtending(true);
    setExtendError('');
    try {
      const subscription = await extendUserSubscription(extendTarget.uid, extendDays);
      setUsers((prev) =>
        prev.map((user) =>
          user.uid === extendTarget.uid ? { ...user, subscription } : user
        )
      );
      setNotice(
        `${displayNameOf(extendTarget)} (#${extendTarget.lumioId ?? '—'}) хэрэглэгчийн эрх ${extendDays} хоногоор сунгагдлаа.`
      );
      setExtendTarget(null);
    } catch (error) {
      console.error('Error extending subscription:', error);
      setExtendError(error instanceof Error ? error.message : 'Эрх сунгаж чадсангүй.');
    } finally {
      setExtending(false);
    }
  };

  return (
    <AdminPageTransition>
      <div className="space-y-5">
        <AdminPageHeader
          title="Хэрэглэгчид"
          description="Lumio ID, нэр эсвэл имэйлээр хайж, гишүүнчлэлийн эрхийг удирдана."
        />

        <AdminPanel className="p-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-600" />
            <Input
              placeholder="Lumio ID (жиш: #12), нэр эсвэл имэйлээр хайх..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-9 rounded-lg border-white/10 bg-white/[0.03] pl-9 text-[13px]"
            />
          </div>
        </AdminPanel>

        {notice && (
          <p className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-sm text-emerald-300">
            {notice}
          </p>
        )}

        <AdminPanel>
          <AdminPanelHeader
            title="Бүртгэлтэй хэрэглэгчид"
            hint={loading ? undefined : `${filteredUsers.length} хэрэглэгч`}
          />
          {loading ? (
            <div className="space-y-2 p-5">
              {[1, 2, 3, 4].map((item) => (
                <Skeleton key={item} className="h-12 rounded-lg" />
              ))}
            </div>
          ) : loadError ? (
            <p className="py-10 text-center text-sm text-red-300">
              Хэрэглэгчдийн жагсаалт ачаалж чадсангүй. Хуудсаа дахин ачаална уу.
            </p>
          ) : filteredUsers.length === 0 ? (
            <div className="flex flex-col items-center py-14 text-center">
              <UsersIcon className="mb-3 size-8 text-zinc-700" />
              <p className="text-sm text-zinc-400">Хэрэглэгч олдсонгүй</p>
            </div>
          ) : (
            <AdminTable>
              <thead>
                <tr>
                  <th>Lumio ID</th>
                  <th>Хэрэглэгч</th>
                  <th>Эрх</th>
                  <th>Гишүүнчлэл</th>
                  <th>Бүртгүүлсэн</th>
                  <th className="text-right!">Үйлдэл</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => {
                  const sub = activeSubscription(user);
                  return (
                    <tr key={user.uid}>
                      <td>
                        {user.lumioId != null ? (
                          <span className="font-mono text-[13px] font-semibold text-pink-300">
                            #{user.lumioId}
                          </span>
                        ) : (
                          <span
                            className="text-xs text-zinc-600"
                            title="Дараагийн нэвтрэлтээр автоматаар дугаар авна"
                          >
                            олгогдоогүй
                          </span>
                        )}
                      </td>
                      <td>
                        <div className="flex items-center gap-3">
                          <UserAvatar
                            src={user.photoURL}
                            alt={displayNameOf(user)}
                            className="size-8 shrink-0 rounded-full object-cover"
                          />
                          <div className="min-w-0">
                            <p className="flex items-center gap-1.5 text-[13px] font-medium text-white">
                              <span className="max-w-[180px] truncate">{displayNameOf(user)}</span>
                              {user.emailVerified && (
                                <BadgeCheck
                                  className="size-3.5 shrink-0 text-emerald-400"
                                  aria-label="Имэйл баталгаажсан"
                                />
                              )}
                            </p>
                            <p className="max-w-[220px] truncate text-xs text-zinc-600">
                              {user.email}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td>
                        {user.role === 'admin' ? (
                          <StatusChip tone="pink">Админ</StatusChip>
                        ) : (
                          <StatusChip tone="zinc">Хэрэглэгч</StatusChip>
                        )}
                      </td>
                      <td>
                        {sub ? (
                          <div>
                            <StatusChip tone="emerald">{sub.plan}</StatusChip>
                            <p className="mt-1 text-[11px] text-zinc-600">
                              {sub.daysLeft} хоног үлдсэн
                            </p>
                          </div>
                        ) : (
                          <StatusChip tone="zinc">FREE</StatusChip>
                        )}
                      </td>
                      <td className="text-xs text-zinc-500">{formatDate(user.createdAt)}</td>
                      <td>
                        <div className="flex justify-end">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 gap-1.5 border-white/10 text-xs"
                            onClick={() => openExtend(user)}
                          >
                            <CalendarPlus className="size-3.5" />
                            Эрх сунгах
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </AdminTable>
          )}
        </AdminPanel>

        {extendTarget && (
          <div className="fixed inset-0 z-[120] flex items-end justify-center p-0 sm:items-center sm:p-4">
            <button
              type="button"
              aria-label="Харилцах цонх хаах"
              className="absolute inset-0 cursor-default bg-black/70 backdrop-blur-sm"
              onClick={() => !extending && setExtendTarget(null)}
            />
            <div
              role="dialog"
              aria-modal="true"
              aria-label="Гишүүнчлэлийн эрх сунгах"
              className="relative w-full rounded-t-xl border border-white/10 bg-[#0d0d0f] p-5 shadow-2xl sm:max-w-md sm:rounded-xl sm:p-6"
            >
              <button
                type="button"
                onClick={() => setExtendTarget(null)}
                disabled={extending}
                aria-label="Хаах"
                className="absolute right-4 top-4 flex size-8 items-center justify-center rounded-md text-zinc-500 transition-colors hover:bg-white/5 hover:text-white disabled:opacity-40"
              >
                <X className="size-4" />
              </button>

              <h2 className="pr-8 text-lg font-semibold text-white">Эрх сунгах</h2>
              <div className="mt-4 flex items-center gap-3 rounded-lg border border-white/[0.07] bg-white/[0.03] p-3">
                <UserAvatar
                  src={extendTarget.photoURL}
                  alt={displayNameOf(extendTarget)}
                  className="size-10 rounded-full object-cover"
                />
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-white">
                    {displayNameOf(extendTarget)}
                  </p>
                  <p className="font-mono text-xs text-pink-300">
                    {extendTarget.lumioId != null ? `#${extendTarget.lumioId}` : 'ID олгогдоогүй'}
                  </p>
                </div>
              </div>

              <p className="mt-4 text-[11px] font-semibold uppercase tracking-wider text-zinc-600">
                Сунгах хугацаа
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                {EXTEND_PRESETS.map((days) => (
                  <button
                    key={days}
                    type="button"
                    onClick={() => setExtendDays(days)}
                    className={`rounded-lg border px-3.5 py-2 text-[13px] transition-colors ${
                      extendDays === days
                        ? 'border-pink-400/50 bg-pink-400/10 text-pink-200'
                        : 'border-white/10 bg-white/[0.03] text-zinc-400 hover:border-white/25 hover:text-white'
                    }`}
                  >
                    {days} хоног
                  </button>
                ))}
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min={1}
                    value={extendDays}
                    onChange={(e) => setExtendDays(Math.max(1, Number(e.target.value) || 1))}
                    className="h-9 w-24 rounded-lg border-white/10 bg-white/[0.03]"
                    aria-label="Сунгах хоногийн тоо"
                  />
                  <span className="text-[13px] text-zinc-500">хоног</span>
                </div>
              </div>

              {(() => {
                const current = activeSubscription(extendTarget);
                return current ? (
                  <p className="mt-3 text-xs text-zinc-500">
                    Одоогийн эрх {current.expires.toLocaleDateString('mn-MN')}-нд дуусна — сунгалт
                    дээр нь нэмэгдэнэ.
                  </p>
                ) : (
                  <p className="mt-3 text-xs text-zinc-500">
                    Одоо идэвхтэй эрхгүй — өнөөдрөөс эхлэн тооцно.
                  </p>
                );
              })()}

              {extendError && <p className="mt-3 text-sm text-red-400">{extendError}</p>}

              <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <Button
                  type="button"
                  variant="outline"
                  disabled={extending}
                  onClick={() => setExtendTarget(null)}
                  className="border-white/10"
                >
                  Цуцлах
                </Button>
                <Button type="button" disabled={extending} onClick={handleExtend}>
                  {extending ? (
                    <>
                      <Loader2 className="mr-2 size-4 animate-spin" />
                      Сунгаж байна...
                    </>
                  ) : (
                    `${extendDays} хоногоор сунгах`
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminPageTransition>
  );
}
