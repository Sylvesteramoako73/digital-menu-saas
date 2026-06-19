import { useRef, useState } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { Check, Copy, Download } from "lucide-react";
import { Vendor } from "../../types";

export default function ShareTab({ vendor }: { vendor: Vendor }) {
  const url = vendor.public_url ?? "";
  const qrContainerRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleDownload() {
    const canvas = qrContainerRef.current?.querySelector("canvas");
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = `${vendor.slug}-menu-qr.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  }

  return (
    <div className="max-w-md space-y-6">
      <div>
        <label className="block text-sm text-neutral-300 mb-1.5">Your public menu URL</label>
        <div className="flex gap-2">
          <input
            type="text"
            readOnly
            value={url}
            className="flex-1 h-12 px-4 text-base rounded-xl bg-neutral-900 border border-red-900 text-white"
          />
          <button
            type="button"
            onClick={handleCopy}
            className="h-12 w-12 shrink-0 flex items-center justify-center rounded-xl bg-red-600 text-white"
            aria-label="Copy URL"
          >
            {copied ? <Check size={18} /> : <Copy size={18} />}
          </button>
        </div>
      </div>

      <div className="flex flex-col items-center gap-4 py-4">
        <div className="p-3 bg-red-700 rounded-2xl">
          <div ref={qrContainerRef} className="p-4 bg-white rounded-xl">
            <QRCodeCanvas value={url || " "} size={256} />
          </div>
        </div>
        <button
          type="button"
          onClick={handleDownload}
          className="h-12 px-6 rounded-xl bg-red-600 text-white font-semibold text-base flex items-center gap-2 active:scale-[0.98] transition"
        >
          <Download size={18} />
          Download QR as PNG
        </button>
      </div>
    </div>
  );
}
