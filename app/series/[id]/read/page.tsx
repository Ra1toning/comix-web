"use client";

import { use, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { MangaReader } from "@/components/reader/MangaReader";
import { getComicById, getChapters, getChapterDetails, Comic, Chapter } from "@/lib/services/firebase-comic";
import {
  getChapterReadingProgress,
  getReadingProgress,
} from "@/lib/services/firebase-reading";
import { useAuth } from "@/lib/useAuth";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/EmptyState";

export default function ReadPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const searchParams = useSearchParams();
  const chapterId = searchParams?.get("chapter");
  const { user } = useAuth();

  const [comic, setComic] = useState<Comic | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [activeChapter, setActiveChapter] = useState<Chapter | null>(null);
  const [loading, setLoading] = useState(true);
  const [resumePage, setResumePage] = useState<number | null>(null);


  useEffect(() => {
    let cancelled = false;

    const fetchData = async () => {
      setLoading(true);
      setActiveChapter(null);
      setResumePage(null);

      try {
        const [fetchedComic, fetchedChapters] = await Promise.all([
          getComicById(id),
          getChapters(id)
        ]);
        if (cancelled) return;
        setComic(fetchedComic);
        setChapters(fetchedChapters);


        let targetChapterId = chapterId;
        let latestProgress: Awaited<ReturnType<typeof getReadingProgress>> | null = null;
        if (user) {
          latestProgress = await getReadingProgress(user.uid, id);
          if (!targetChapterId && latestProgress?.chapterId) {
            targetChapterId = latestProgress.chapterId;
          }
        }

        const earliestChapter =
          fetchedChapters.length > 0
            ? fetchedChapters[fetchedChapters.length - 1]
            : null;
        const targetBelongsToComic = fetchedChapters.some(
          chapter => chapter.id === targetChapterId
        );

        if (!targetChapterId || !targetBelongsToComic) {
          targetChapterId = earliestChapter?.id || null;
        }

        if (targetChapterId) {
          const chapterData = await getChapterDetails(targetChapterId);
          if (cancelled) return;
          setActiveChapter(chapterData);

          if (user && chapterData) {
            const chapterProgress = await getChapterReadingProgress(
              user.uid,
              id,
              targetChapterId
            );
            if (cancelled) return;

            const legacyProgress =
              latestProgress?.chapterId === targetChapterId ? latestProgress : null;
            const savedPage = chapterProgress?.page ?? legacyProgress?.page;
            setResumePage(typeof savedPage === "number" ? savedPage : 1);
          } else {
            setResumePage(1);
          }
        }
      } catch (err) {
        console.error("Failed to load manga reading data:", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchData();
    return () => {
      cancelled = true;
    };
  }, [id, chapterId, user]);

  if (loading) {
    return (
      <div className="fixed inset-0 bg-[#050505]">
        <div className="absolute top-0 left-0 w-full p-4 md:px-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-3 w-32" />
              <Skeleton className="h-3 w-20" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-10 w-10 rounded-full" />
            <Skeleton className="h-10 w-10 rounded-full hidden sm:block" />
          </div>
        </div>
        <div className="absolute inset-0 flex items-center justify-center pt-12">
          <Skeleton className="h-[70vh] w-[80vw] max-w-3xl rounded-2xl" />
        </div>
        <div className="absolute bottom-0 left-0 w-full p-6 md:px-8 pb-10">
          <Skeleton className="h-4 w-2/3 mx-auto" />
          <div className="mt-6 flex items-center justify-between max-w-2xl mx-auto">
            <Skeleton className="h-10 w-10 rounded-full" />
            <Skeleton className="h-10 w-48 rounded-full" />
            <Skeleton className="h-10 w-10 rounded-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!comic || !activeChapter || chapters.length === 0) {
    return (
      <div className="fixed inset-0 bg-[#050505] flex items-center justify-center">
        <EmptyState
          title="Унших өгөгдөл олдсонгүй"
          description="Таны хайсан зүйл олдсонгүй."
          imageClassName="w-40"
        />
      </div>
    );
  }

  return (
    <MangaReader
      key={activeChapter.id}
      seriesId={id}
      chapterId={activeChapter.id}
      chapterNumber={activeChapter.chapterNumber}
      title={comic.title}
      pages={activeChapter.pages || []}
      userId={user?.uid}
      resumePage={resumePage ?? undefined}
      chapters={chapters.map(ch => ({
        id: ch.id,
        title: ch.title || `Бүлэг ${ch.chapterNumber}`
      }))}
    />
  );
}
