import type { Meter } from '../api/types';
import type { TimeScale } from '../config';
import { MeterCard } from './MeterCard';

interface MeterGridProps {
  meters: Meter[];
  timeScale: TimeScale;
  refreshToken: number | null;
}

export function MeterGrid({ meters, timeScale, refreshToken }: MeterGridProps) {
  return (
    <div id="meters-container" className="meter-grid">
      {meters.map((meter) => (
        <MeterCard key={meter.device_id} meter={meter} timeScale={timeScale} refreshToken={refreshToken} />
      ))}
    </div>
  );
}
