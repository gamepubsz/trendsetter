export default function LoadingSpinner({ size = 24 }: { size?: number }) {
  return (
    <div className="flex items-center justify-center p-8">
      <div
        className="border-4 border-gray-700 border-t-red-500 rounded-full animate-spin"
        style={{ width: size, height: size }}
      />
    </div>
  );
}
