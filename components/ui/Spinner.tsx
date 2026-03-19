export function Spinner({ size = 24 }: { size?: number }) {
  return (
    <div
      style={{ width: size, height: size }}
      className="animate-spin rounded-full border-2 border-gray-300 border-t-blue-600"
    />
  )
}

export function PageSpinner() {
  return (
    <div className="flex items-center justify-center min-h-[200px]">
      <Spinner size={40} />
    </div>
  )
}
