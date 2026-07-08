import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { backupUrl, fetchMeters, fetchStatus, triggerRefresh } from "./api/client";
import type { TimeScale } from "./api/types";
import { Controls } from "./components/Controls";
import { MeterCard } from "./components/MeterCard";
import { Navbar } from "./components/Navbar";
import { RateLimitWarning } from "./components/RateLimitWarning";
import { StatusBar } from "./components/StatusBar";
import { REFRESH_INTERVAL } from "./config";

export function App() {
  const queryClient = useQueryClient();
  const [timeScale, setTimeScale] = useState<TimeScale>("day");

  // Meters and status are fetched in parallel (React Query runs them
  // independently), replacing the legacy nested-callback data load.
  const metersQuery = useQuery({
    queryKey: ["meters"],
    queryFn: fetchMeters,
    refetchInterval: REFRESH_INTERVAL,
  });

  const statusQuery = useQuery({
    queryKey: ["status"],
    queryFn: fetchStatus,
    refetchInterval: REFRESH_INTERVAL,
  });

  const refreshMutation = useMutation({
    mutationFn: triggerRefresh,
    onSettled: () => {
      queryClient.invalidateQueries();
    },
  });

  const meters = metersQuery.data?.meters ?? [];
  const status = statusQuery.data;
  const connected = !metersQuery.isError && !statusQuery.isError;
  const errorMessage = metersQuery.error?.message ?? statusQuery.error?.message;

  const lastRefresh =
    metersQuery.dataUpdatedAt > 0 ? new Date(metersQuery.dataUpdatedAt) : null;

  const isLoading = metersQuery.isLoading || statusQuery.isLoading;

  return (
    <>
      <Navbar connected={connected} />
      <div className="container">
        <Controls
          timeScale={timeScale}
          onTimeScaleChange={setTimeScale}
          onRefresh={() => refreshMutation.mutate()}
          onBackup={() => window.open(backupUrl(), "_blank")}
          refreshing={refreshMutation.isPending}
        />

        {status && <StatusBar status={status} lastRefresh={lastRefresh} />}

        {status?.is_rate_limited && (
          <RateLimitWarning backoffRemaining={status.backoff_remaining} />
        )}

        {isLoading && (
          <div className="loading">
            <p>Loading temperature data...</p>
          </div>
        )}

        {!connected && errorMessage && (
          <div className="alert alert-danger">
            <strong>Error.</strong> {errorMessage}
          </div>
        )}

        <div className="meter-grid">
          {meters.map((meter) => (
            <MeterCard
              key={meter.device_id}
              meter={meter}
              timeScale={timeScale}
            />
          ))}
        </div>

        <footer>
          Temp Master Dashboard v1.0 - Built with React + Vite + TypeScript
        </footer>
      </div>
    </>
  );
}
