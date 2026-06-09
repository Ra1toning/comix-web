'use client';

import { useEffect, useState } from 'react';
import { getAllUsersForAdmin, UserForAdmin } from '@/lib/services/firebase-admin';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { UserAvatar } from '@/components/shared/UserAvatar';
import { Users as UsersIcon } from 'lucide-react';

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserForAdmin[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserForAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const data = await getAllUsersForAdmin();
        setUsers(data);
        setFilteredUsers(data);
      } catch (error) {
        console.error('Error fetching users:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);


  useEffect(() => {
    const filtered = users.filter(user =>
      user.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.uniqueId?.includes(searchTerm)
    );
    setFilteredUsers(filtered);
  }, [searchTerm, users]);

  return (
    <div className="space-y-6">

      <div>
        <h1 className="text-3xl font-bold">Хэрэглэгчид</h1>
        <p className="text-foreground/70 mt-2">Платформын хэрэглэгчдийн мэдээлэл</p>
      </div>


      <Card className="border-white/10">
        <CardContent className="pt-6">
          <Input
            placeholder="Нэр, имэйл эсвэл ID-аар хайх..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-white/5 border-white/10"
          />
        </CardContent>
      </Card>


      <Card className="border-white/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UsersIcon className="w-5 h-5" />
            Нийт хэрэглэгч ({filteredUsers.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              <Skeleton className="h-12" />
              <Skeleton className="h-12" />
              <Skeleton className="h-12" />
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-foreground/70">Хэрэглэгч олдсонгүй</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-white/10">
                  <tr>
                    <th className="text-left py-3 px-4">Нэр</th>
                    <th className="text-left py-3 px-4">Имэйл</th>
                    <th className="text-left py-3 px-4">ID</th>
                    <th className="text-left py-3 px-4">Эрх</th>
                    <th className="text-left py-3 px-4">Бүртгүүлсэн</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => (
                    <tr key={user.uid} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <UserAvatar
                            src={user.photoURL}
                            alt={user.displayName || "Avatar"}
                            className="h-8 w-8 rounded-full object-cover"
                          />
                          <span>{user.displayName}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-foreground/70">{user.email}</td>
                      <td className="py-3 px-4 font-mono text-sm">{user.uniqueId}</td>
                      <td className="py-3 px-4">
                        {user.role === 'admin' ? (
                          <Badge className="bg-pink-500/20 text-pink-400 border-pink-500/30">
                            Админ
                          </Badge>
                        ) : (
                          <Badge variant="secondary">Хэрэглэгч</Badge>
                        )}
                      </td>
                      <td className="py-3 px-4 text-foreground/70 text-xs">
                        {user.createdAt?.toDate?.()?.toLocaleDateString?.('mn-MN') || 'Тодорхойгүй'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
