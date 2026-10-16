export function LoadingState({ message = 'Loading temperature data...' }: { message?: string }) {
  return (
    <div role="status" className="py-10 text-center text-muted">
      {message}
    </div>
  );
}
