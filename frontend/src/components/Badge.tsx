import clsx from "clsx";

const variants: Record<string, string> = {
  idea: "bg-gray-700 text-gray-300",
  scripted: "bg-blue-900/50 text-blue-300",
  filmed: "bg-yellow-900/50 text-yellow-300",
  published: "bg-green-900/50 text-green-300",
  youtube: "bg-red-900/50 text-red-300",
  google: "bg-blue-900/50 text-blue-300",
  reddit: "bg-orange-900/50 text-orange-300",
  default: "bg-gray-700 text-gray-300",
};

export default function Badge({ label, variant }: { label: string; variant?: string }) {
  const cls = variants[variant ?? label] ?? variants.default;
  return (
    <span className={clsx("px-2 py-0.5 rounded-full text-xs font-medium", cls)}>
      {label}
    </span>
  );
}
