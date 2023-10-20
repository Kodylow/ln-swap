import { Result } from "@zxing/library";
import { useRef } from "react";
import { QrReader } from "react-qr-reader";
import { Button } from "./ui/button";

export default function Scanner({
  onResult,
  scanning,
  stopScanning,
}: {
  onResult: (data: Result) => void;
  scanning: boolean;
  stopScanning: () => void;
}) {
  const successRef = useRef(false);

  const terminateStreams = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });

    stream.getTracks().forEach(function (track) {
      track.stop();
    });
  };

  return (
    <div className="flex flex-col gap-2">
      <QrReader
        onResult={(result, error) => {
          // Is called on an interval basis, so ignoring it
          if (error || !result || !scanning || successRef.current) {
            return;
          } else if (result) {
            onResult(result);
            terminateStreams();
            successRef.current = true;
            stopScanning();
          }
        }}
        className="rounded w-full border"
        constraints={{ facingMode: "user" }}
      />
      <Button onClick={stopScanning}>Cancel</Button>
    </div>
  );
}
