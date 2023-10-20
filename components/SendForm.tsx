import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Form, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useToast } from "@/components/ui/use-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Loader2, QrCodeIcon } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";
import Scanner from "./Scanner";

const FormSchema = z.object({
  amount: z.number(),
  address: z.string(),
});

export default function SendForm({
  min,
  max,
  shitcoin,
}: {
  min: number;
  max: number;
  shitcoin: string;
}) {
  const [scanning, setScanning] = useState(false);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      amount: min * 100000000,
      address: "",
    },
  });

  const mutation = useMutation({
    mutationFn: async (fields: z.infer<typeof FormSchema>) => {
      const { data, error } = await fetch("/api/send", {
        method: "POST",
        body: JSON.stringify({
          to: shitcoin,
          amount: fields.amount / 100000000,
          address: fields.address,
        }),
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      }).then((r) => r.json());

      if (error) {
        toast({
          title: "An error occurred",
          description: error,
          duration: 2500,
        });

        return;
      }

      if (typeof window.webln !== "undefined") {
        await window.webln.enable();
        try {
          const { preimage } = await window.webln.sendPayment(data.invoice);

          if (preimage) {
            toast({
              title: "Success",
              description: "Payment sent",
              duration: 2500,
            });
          } else {
            toast({
              title: "Failed",
              description: "The payment failed to go through",
              duration: 2500,
            });
          }
        } catch (err) {
          toast({
            title: "An error occurred",
            description: (err as any).message,
            duration: 2500,
          });
        }
      }
    },
  });

  return (
    <div className="flex-col gap-2">
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit((data) => mutation.mutate(data))}
          className="flex flex-col gap-4"
        >
          <FormField
            control={form.control}
            name="amount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Amount (Sats)</FormLabel>
                <Input
                  value={field.value}
                  onChange={(e) => field.onChange(Number(e.target.value))}
                  placeholder="69420"
                  min={min * 100000000}
                  max={max * 100000000}
                  type="number"
                  step="any"
                />
                <span className="text-xs text-muted-foreground">
                  + Swap Fee: {Math.round(field.value / 100)} sats
                </span>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="address"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Address</FormLabel>
                <div className="flex gap-2">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          type="button"
                          size="icon"
                          variant="outline"
                          className="shrink-0"
                          onClick={() => setScanning(true)}
                        >
                          <QrCodeIcon className="w-6 h-6" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <span className="text-sm">Scan QR Code</span>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  <Input
                    value={field.value}
                    onChange={(e) => field.onChange(e.target.value)}
                    placeholder="0xAb5801a7D398351b8bE11C439..."
                  />
                </div>
              </FormItem>
            )}
          />

          <Button
            type="submit"
            className="grow"
            disabled={mutation.status === "pending"}
          >
            {mutation.status === "pending" ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : null}
            Submit
          </Button>
        </form>

        <Dialog open={scanning} onOpenChange={setScanning}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>Scan QR Code</DialogTitle>
            </DialogHeader>

            <Scanner
              scanning={scanning}
              stopScanning={() => setScanning(false)}
              onResult={(data) => {
                const res = data.getText();
                toast({
                  description: "Address successfully scanned",
                  duration: 1500,
                });
                form.setValue(
                  "address",
                  res.startsWith("ethereum:") ? res.split(":")[1] : res,
                );
              }}
            />
          </DialogContent>
        </Dialog>
      </Form>
    </div>
  );
}
