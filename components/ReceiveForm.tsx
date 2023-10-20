import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Form, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { AlertCircle, Copy, Loader2 } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import QRCode from "react-qr-code";
import * as z from "zod";
import { Switch } from "./ui/switch";
import { useToast } from "./ui/use-toast";

const FormSchema = z.object({
  amount: z.number(),
});

export default function ReceiveForm({
  shitcoin,
  min,
  max,
}: {
  shitcoin: string;
  min: number;
  max: number;
}) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [invoiceUri, setInvoiceUri] = useState(false);

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      amount: min,
    },
  });

  const { mutate, status, data } = useMutation({
    mutationFn: async (data: z.infer<typeof FormSchema>) => {
      if (typeof window.webln !== "undefined") {
        await window.webln.enable();

        const rates = await fetch(`/api/rate?from=${shitcoin}&to=BTC`).then(
          (r) => r.json(),
        );

        if (rates) {
          try {
            const sats = +(data.amount * rates.data.from.rate).toFixed(7);

            const { paymentRequest } = await window.webln.makeInvoice({
              amount: sats * 100000000,
            });

            const res = await fetch("/api/receive", {
              method: "POST",
              body: JSON.stringify({
                from: shitcoin,
                amount: sats,
                address: paymentRequest,
              }),
              headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
              },
            }).then((r) => r.json());

            if (res.error) {
              toast({
                title: "Error",
                description: res.error,
              });
            } else {
              setOpen(true);
              return res;
            }
          } catch (e) {
            toast({
              title: "Error",
              description: (e as any).message,
            });
          }
        }
      }
    },
  });

  const copyText = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast({
        description: "Copied!",
        duration: 1500,
      });
    });
  };

  return (
    <div className="flex-col gap-2">
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit((data) => mutate(data))}
          className="flex flex-col gap-4"
        >
          <FormField
            control={form.control}
            name="amount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Amount ({shitcoin})</FormLabel>
                <Input
                  value={field.value}
                  onChange={(e) => field.onChange(Number(e.target.value))}
                  placeholder="69420"
                  type="number"
                  min={min}
                  max={max}
                  step="any"
                />
                <span className="text-xs text-muted-foreground">
                  + Swap Fee: {(field.value / 100).toFixed(3)} {shitcoin}
                </span>
              </FormItem>
            )}
          />

          <Button
            type="submit"
            className="grow"
            disabled={status === "pending"}
          >
            {status === "pending" ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : null}
            Submit
          </Button>
        </form>
      </Form>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          {data ? (
            <>
              <DialogHeader>
                <DialogTitle>Send Payment</DialogTitle>
              </DialogHeader>

              {invoiceUri ? (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Heads Up!</AlertTitle>
                  <AlertDescription>
                    <AlertDescription>
                      Some apps don&apos;t support invoice URIs and some work
                      only on certain networks.
                    </AlertDescription>
                  </AlertDescription>
                </Alert>
              ) : (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Important Notice</AlertTitle>
                  <AlertDescription>
                    <AlertDescription>
                      <span className="text-sm mt-2 text-muted-foreground">
                        You must send Exactly{" "}
                        <span
                          className="text-foreground cursor-pointer border-b border-foreground"
                          onClick={() => copyText(data.data.amount)}
                        >
                          <Copy className="w-3 h-3 inline" /> {data.data.amount}{" "}
                          {shitcoin}
                        </span>{" "}
                        to the{" "}
                        <span
                          className="text-foreground cursor-pointer border-b border-foreground"
                          onClick={() => copyText(data.data.recipientAddress)}
                        >
                          <Copy className="w-3 h-3 inline" /> Recipient Address
                        </span>{" "}
                        or <strong className="text-foreground">ALL</strong>{" "}
                        funds will be lost
                      </span>
                    </AlertDescription>
                  </AlertDescription>
                </Alert>
              )}

              <div className="flex justify-center p-4 bg-secondary rounded-lg w-full">
                <QRCode
                  size={256}
                  value={
                    invoiceUri ? data.data.invoice : data.data.recipientAddress
                  }
                  bgColor="hsl(var(--secondary))"
                  fgColor="hsl(var(--foreground))"
                  style={{
                    height: "auto",
                    maxWidth: "100%",
                    width: "100%",
                    maxHeight: 240,
                  }}
                />
              </div>

              <div className="flex gap-2 items-center w-full min-w-0">
                <Button
                  size="icon"
                  variant="outline"
                  className="shrink-0"
                  onClick={() =>
                    copyText(
                      invoiceUri
                        ? data.data.invoice
                        : data.data.recipientAddress,
                    )
                  }
                >
                  <Copy className="w-4 h-4" />
                </Button>

                <span className="line-clamp-2 text-xs text-muted-foreground">
                  {invoiceUri ? data.data.invoice : data.data.recipientAddress}
                </span>
              </div>

              <div className="flex gap-2 items-center">
                <Switch checked={invoiceUri} onCheckedChange={setInvoiceUri} />{" "}
                <span className="text-sm">Shitcoin URI</span>
              </div>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
