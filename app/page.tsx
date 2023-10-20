"use client";
import Form from "@/components/Form";
import Notice from "@/components/Notice";
import { ModeToggle } from "@/components/theme-toggle";
import { Skeleton } from "@/components/ui/skeleton";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useTheme } from "next-themes";
import Image from "next/image";
import { useEffect, useState } from "react";

const queryClient = new QueryClient();

export default function Home() {
  const [weblnEnabled, setWebLnEnabled] = useState<"loading" | boolean>(
    "loading",
  );

  const { theme } = useTheme();

  useEffect(() => {
    setWebLnEnabled(typeof window.webln !== "undefined");
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <main className="flex min-h-screen w-full flex-col">
        <div className="flex justify-between px-2 md:px-4 py-2 md:border-b md:border-border">
          <div className="flex gap-2 items-center invisible md:visible">
            {theme === "light" ? (
              <Image
                width={285 / 2}
                height={87 / 2}
                src="/swap-light.png"
                alt="Logo"
              />
            ) : (
              <Image
                width={285 / 2}
                height={87 / 2}
                src="/swap-dark.png"
                alt="Logo"
              />
            )}
          </div>

          <ModeToggle />
        </div>
        {typeof weblnEnabled === "string" ? (
          <div className="flex items-center justify-center p-4 grow w-full">
            <div className="flex flex-col gap-4">
              <Skeleton className="w-[280px] h-[24px]"></Skeleton>
              <Skeleton className="w-[280px] h-[24px]"></Skeleton>
              <Skeleton className="w-[280px] h-[24px]"></Skeleton>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center p-4 grow w-full overflow-x-hidden min-w-0 gap-4">
            <div className="md:invisible">
              {theme === "light" ? (
                <Image
                  width={285 / 2}
                  height={87 / 2}
                  src="/swap-light.png"
                  alt="Logo"
                />
              ) : (
                <Image
                  width={285 / 2}
                  height={87 / 2}
                  src="/swap-dark.png"
                  alt="Logo"
                />
              )}
            </div>
            {weblnEnabled ? <Form /> : <Notice />}
          </div>
        )}
      </main>
    </QueryClientProvider>
  );
}
