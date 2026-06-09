'use client';

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/authStore";
import { Skeleton } from "@/components/ui/skeleton";
import { isCurrentUserAdmin } from "@/lib/services/firebase-admin";

interface AdminGuardProps {
  children: React.ReactNode;
}

export const AdminGuard = ({ children }: AdminGuardProps) => {
  const router = useRouter();
  const { user, loading } = useAuthStore();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const checkAdmin = async () => {

      if (!loading && !user) {
        if (isMounted) {
          setIsChecking(false);
          router.push("/login");
        }
        return;
      }


      if (user && user.uid) {
        try {
          const adminStatus = await isCurrentUserAdmin(user.uid);
          if (isMounted) {
            if (!adminStatus) {
              setIsChecking(false);
              router.push("/home");
            } else {
              setIsAdmin(true);
              setIsChecking(false);
            }
          }
        } catch (error) {
          console.error("Error checking admin status:", error);
          if (isMounted) {
            setIsChecking(false);
            router.push("/home");
          }
        }
      }
    };

    checkAdmin();

    return () => {
      isMounted = false;
    };
  }, [user, loading, router]);


  if (isChecking || loading) {
    return (
      <div className="min-h-screen bg-[var(--background)] p-6 md:p-8">
        <div className="space-y-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }


  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
        <div className="text-center">
          <p className="text-foreground">Redirecting...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
