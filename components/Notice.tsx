import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ZapOff } from "lucide-react";
import { Button } from "./ui/button";

export default function Notice() {
  return (
    <Alert className="max-w-sm flex flex-col gap-1">
      <ZapOff className="h-4 w-4" />
      <AlertTitle>WebLN Provider Required</AlertTitle>
      <AlertDescription className="text-muted-foreground">
        A WebLN Provider such as{" "}
        <a
          className="text-foreground underline"
          href="https://alpha.fedi.xyz"
          target="_blank"
          rel="noreferrer"
        >
          Fedi
        </a>{" "}
        is required in order to use this application.
      </AlertDescription>

      <Button
        className="w-full mt-2"
        size="sm"
        onClick={() => {
          window.location.reload();
        }}
      >
        Refresh
      </Button>
    </Alert>
  );
}
