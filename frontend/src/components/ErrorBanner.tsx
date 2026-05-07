import { AlertCircle } from "lucide-react";

export default function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="flex items-center gap-3 bg-red-900/30 border border-red-700 rounded-lg px-4 py-3 text-red-300 text-sm">
      <AlertCircle size={16} className="flex-shrink-0" />
      <span>{message}</span>
    </div>
  );
}
