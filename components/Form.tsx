import { Status, statuses } from "@/app/type";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { shitcoins } from "@/lib/constants";
import { useQuery } from "@tanstack/react-query";
import { Globe } from "lucide-react";
import { useEffect, useState } from "react";
import ReceiveForm from "./ReceiveForm";
import SendForm from "./SendForm";
import { Progress } from "./ui/progress";
import { Skeleton } from "./ui/skeleton";

function LoadingSkeleton() {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-2">
        <Skeleton className="rounded-full w-[64px] h-4" />
        <Skeleton className="rounded-full w-full h-8" />
      </div>
      <div className="flex flex-col gap-2">
        <Skeleton className="rounded-full w-[64px] h-4" />
        <Skeleton className="rounded-full w-full h-8" />
      </div>
      <Skeleton className="rounded w-full h-8" />
    </div>
  );
}

export default function ExchangeForm() {
  const [action, setAction] = useState<"send" | "receive">("send");
  const [shitcoin, setShitcoin] = useState<(typeof shitcoins)[number]["code"]>(
    shitcoins[0].code,
  );
  const [order, setOrder] = useState<{
    token: string;
    id: string;
  } | null>(null);
  const [status, setStatus] = useState(Status.NEW);

  const { data, isLoading } = useQuery({
    queryKey: ["prices", { action, shitcoin }],
    queryFn: async () => {
      const res = await fetch(
        `/api/rate?from=${action === "send" ? "BTC" : shitcoin}&to=${
          action === "send" ? shitcoin : "BTC"
        }`,
      )
        .then((r) => r.json())
        .catch((err) => {
          throw new Error(err);
        });

      if (!res) {
        throw new Error("Could not fetch rates from fixedfloat.");
      }

      if (res.error) {
        throw new Error(res.error);
      }

      return res.data;
    },
  });

  useEffect(() => {
    if (order) {
      const pollInterval = setInterval(() => {
        if (status === Status.DONE || status === Status.EMERGENCY) {
          clearInterval(pollInterval);
          return;
        }

        fetch(`/api/status?id=${order.id}&token=${order.token}`)
          .then((r) => r.json())
          .then((res) => {
            if (res?.data?.status) {
              setStatus(Status[res.data.status as keyof typeof Status]);
            }
          });
      }, 5000);

      return () => {
        clearInterval(pollInterval);
      };
    }
  }, [order]);

  return (
    <div className="flex flex-row justify-center p-4 min-w-[280px] w-full min-w-0">
      <Tabs
        value={action}
        onValueChange={(value) => setAction(value as "send" | "receive")}
        className="w-[400px] flex flex-col gap-3"
      >
        <TabsList>
          <TabsTrigger value="send" className="grow">
            Send ⚡️
          </TabsTrigger>
          <TabsTrigger value="receive" className="grow">
            Receive ⚡️
          </TabsTrigger>
        </TabsList>

        <div className="flex flex-col gap-3 mt-3">
          <Label htmlFor="shitcoin">
            Shitcoin / Cryptocurrency (same thing)
          </Label>
          <Select
            onValueChange={(value) =>
              setShitcoin(value as (typeof shitcoins)[number]["code"])
            }
            defaultValue={shitcoin}
          >
            <SelectTrigger className="shitcoin">
              <SelectValue placeholder="Select Action" />
            </SelectTrigger>
            <SelectContent className="flex flex-col">
              {shitcoins.map((coin, i) => (
                <SelectItem
                  value={coin.code}
                  key={i}
                  className="flex grow w-full"
                >
                  <div className="flex gap-2 items-center w-full grow">
                    <img
                      src={coin.logo}
                      width={16}
                      height={16}
                      alt={coin.name + " Logo"}
                      className="rounded"
                    />
                    <span className="grow w-full">{coin.name}</span>

                    <span className="text-xs text-muted-foreground flex gap-1 items-center">
                      <Globe className="w-3 h-3 text-muted-foreground" />
                      {coin.network}
                    </span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <TabsContent value="send" className="mt-0">
          {isLoading ? (
            <div className="flex flex-col gap-4 mt-1">
              <div className="flex flex-col gap-2">
                <Skeleton className="rounded-full w-[64px] h-5" />
                <Skeleton className="rounded-full w-full h-[42px]" />
              </div>
              <div className="flex flex-col gap-2">
                <Skeleton className="rounded-full w-[64px] h-5" />
                <Skeleton className="rounded-full w-full h-[42px]" />
              </div>
              <Skeleton className="rounded-lg w-full h-[40px]" />
            </div>
          ) : (
            <SendForm
              min={data.from.min}
              max={data.from.max}
              shitcoin={shitcoin}
              setOrder={setOrder}
            />
          )}
        </TabsContent>
        <TabsContent value="receive" className="mt-0">
          {isLoading ? (
            <div className="flex flex-col gap-4 mt-1">
              <div className="flex flex-col gap-2">
                <Skeleton className="rounded-full w-[64px] h-5" />
                <Skeleton className="rounded-full w-full h-[42px]" />
              </div>
              <Skeleton className="rounded-lg w-full h-[40px]" />
            </div>
          ) : (
            <ReceiveForm
              min={data.from.min}
              max={data.from.max}
              shitcoin={shitcoin}
              setOrder={setOrder}
            />
          )}
        </TabsContent>

        {order ? (
          <div className="flex flex-col gap-2 justify-center mt-8">
            <span className="font-bold text-md text-center">
              Progress: {statuses.find((x) => x.type === status)?.type}
            </span>
            <Progress
              value={
                status === Status.EMERGENCY
                  ? 100
                  : (statuses.findIndex((x) => x.type === status) /
                      (statuses.length - 3)) *
                    100
              }
              className="w-full"
            />
            <span className="text-muted-foreground text-sm text-center">
              {statuses.find((x) => x.type === status)?.description}
            </span>
          </div>
        ) : null}
      </Tabs>
    </div>
  );
}
