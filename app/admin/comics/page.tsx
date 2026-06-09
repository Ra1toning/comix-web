'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getAllComics, Comic } from '@/lib/services/firebase-comic';
import { deleteComic } from '@/lib/services/firebase-admin';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { BookOpen, Trash2, Edit2, Plus } from 'lucide-react';

export default function AdminComicsPage() {
  const [comics, setComics] = useState<Comic[]>([]);
  const [filteredComics, setFilteredComics] = useState<Comic[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [deleting, setDeleting] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Comic | null>(null);
  const [errorMessage, setErrorMessage] = useState('');


  useEffect(() => {
    const fetchComics = async () => {
      try {
        const data = await getAllComics();
        setComics(data);
        setFilteredComics(data);
      } catch (error) {
        console.error('Error fetching comics:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchComics();
  }, []);


  useEffect(() => {
    let filtered = comics;

    if (searchTerm) {
      filtered = filtered.filter(comic =>
        comic.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        comic.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        comic.author?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedGenre) {
      filtered = filtered.filter(comic => comic.genres.includes(selectedGenre));
    }

    if (selectedStatus) {
      filtered = filtered.filter(comic => comic.status === selectedStatus);
    }

    if (selectedType) {
      filtered = filtered.filter(comic => comic.type === selectedType);
    }

    setFilteredComics(filtered);
  }, [searchTerm, selectedGenre, selectedStatus, selectedType, comics]);


  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(deleteTarget.id);
    setErrorMessage('');
    try {
      await deleteComic(deleteTarget.id);
      setComics(prev => prev.filter(c => c.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (error) {
      console.error('Error deleting comic:', error);
      setErrorMessage('Комик устгаж чадсангүй. Дахин оролдоно уу.');
      setDeleteTarget(null);
    } finally {
      setDeleting(null);
    }
  };


  const allGenres = Array.from(new Set(comics.flatMap(c => c.genres)));
  const allTypes = Array.from(new Set(comics.map(c => c.type)));
  const allStatuses = Array.from(new Set(comics.map(c => c.status)));

  return (
    <div className="space-y-6">

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Комикууд</h1>
          <p className="text-foreground/70 mt-2">Бүх комик болон нийтлэлийг удирдах</p>
        </div>
        <Link href="/admin/comics/new">
          <Button className="bg-linear-to-r from-cyan-300 via-emerald-200 to-amber-200 text-zinc-950 hover:brightness-105">
            <Plus className="w-4 h-4 mr-2" />
            Комик нэмэх
          </Button>
        </Link>
      </div>


      <Card className="border-white/10">
        <CardContent className="pt-6 space-y-4">
          <Input
            placeholder="Гарчиг, тайлбар эсвэл зохиогчоор хайх..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-white/5 border-white/10"
          />

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <select
              value={selectedGenre}
              onChange={(e) => setSelectedGenre(e.target.value)}
              className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
            >
              <option value="">Бүх жанр</option>
              {allGenres.map(genre => (
                <option key={genre} value={genre}>{genre}</option>
              ))}
            </select>

            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
            >
              <option value="">Бүх төлөв</option>
              {allStatuses.map(status => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>

            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
            >
              <option value="">Бүх төрөл</option>
              {allTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>

            <Button
              variant="secondary"
              onClick={() => {
                setSearchTerm('');
                setSelectedGenre('');
                setSelectedStatus('');
                setSelectedType('');
              }}
            >
              Шүүлтүүр цэвэрлэх
            </Button>
          </div>
        </CardContent>
      </Card>


      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      ) : filteredComics.length === 0 ? (
        <Card className="border-white/10">
          <CardContent className="pt-12 pb-12 text-center">
            <BookOpen className="w-12 h-12 mx-auto text-foreground/30 mb-4" />
            <p className="text-foreground/70">Комик олдсонгүй</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredComics.map(comic => (
            <Card key={comic.id} className="border-white/10 overflow-hidden group hover:border-pink-500/50 transition-colors">
              <div className="relative h-48 bg-gradient-to-b from-pink-500/20 to-purple-500/20 overflow-hidden">
                {comic.poster && (
                  <img
                    src={comic.poster}
                    alt={comic.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                )}
                <div className="absolute inset-0 bg-black/50 flex items-end p-3">
                  <div className="flex-1">
                    <h3 className="font-bold text-sm line-clamp-2">{comic.title}</h3>
                    <p className="text-xs text-foreground/70">{comic.author || 'Зохиогч тодорхойгүй'}</p>
                  </div>
                </div>
              </div>

              <CardContent className="pt-4 space-y-3">

                <div className="flex flex-wrap gap-2">
                  <Badge className={comic.isPublished ? 'bg-green-500/20 text-green-400 border-green-500/30' : 'bg-gray-500/20 text-gray-400 border-gray-500/30'}>
                    {comic.isPublished ? 'Нийтлэгдсэн' : 'Ноорог'}
                  </Badge>
                  <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
                    {comic.status}
                  </Badge>
                  <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30">
                    {comic.type}
                  </Badge>
                </div>


                <div className="grid grid-cols-3 text-xs text-foreground/70">
                  <div>
                    <p className="font-medium">{comic.publishedChapters}</p>
                    <p>Нийтэлсэн бүлэг</p>
                  </div>
                  <div>
                    <p className="font-medium">{comic.viewCount.toLocaleString()}</p>
                    <p>Үзэлт</p>
                  </div>
                  <div>
                    <p className="font-medium">{comic.likeCount || 0}</p>
                    <p>Таалагдсан</p>
                  </div>
                </div>


                <div className="flex gap-2 pt-2">
                  <Link href={`/admin/comics/${comic.id}/edit`} className="flex-1">
                    <Button variant="secondary" size="sm" className="w-full">
                      <Edit2 className="w-4 h-4 mr-1" />
                      Засах
                    </Button>
                  </Link>
                  <Link href={`/admin/comics/${comic.id}/chapters`} className="flex-1">
                    <Button variant="outline" size="sm" className="w-full border-white/10">
                      Бүлгүүд
                    </Button>
                  </Link>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => setDeleteTarget(comic)}
                    disabled={deleting === comic.id}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}


      {filteredComics.length > 0 && (
        <p className="text-sm text-foreground/70 text-center">
          Нийт {comics.length} комикоос {filteredComics.length}-г харуулж байна
        </p>
      )}

      {errorMessage && (
        <p className="border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-300">
          {errorMessage}
        </p>
      )}

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Комик устгах"
        description={`"${deleteTarget?.title || ''}" комик болон түүнд хамаарах бүх бүлэг, зураг бүр мөсөн устна.`}
        loading={Boolean(deleting)}
        onConfirm={handleDelete}
        onOpenChange={(open) => {
          if (!open && !deleting) setDeleteTarget(null);
        }}
      />
    </div>
  );
}
