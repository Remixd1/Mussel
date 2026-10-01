/**
 * Thin route components. Screens not yet built render a placeholder; each is
 * replaced by a real page in its phase (CLAUDE.md §8, §12).
 */
import { useParams } from 'react-router-dom';
import { useCopy } from '../hooks/useCopy';
import { Placeholder } from './Placeholder';

export function WorkoutPage() {
  return <Placeholder title="Test in Progress" icon="squat" phase={3} />;
}

export function WorkoutSummaryPage() {
  const { id } = useParams();
  return <Placeholder title={`Printout ${id ?? ''}`} icon="pr" phase={3} />;
}

export function UploadPage() {
  return <Placeholder title="Chart Intake" icon="machine" phase={2} />;
}

export function ChartDetailPage() {
  const { chartId } = useParams();
  return <Placeholder title={`Chart ${chartId ?? ''}`} icon="machine" phase={2} />;
}

export function NotFoundPage() {
  const copy = useCopy();
  return (
    <Placeholder title="Not Found" icon="form-warning" phase={0}>
      <p>{copy('notFound.body')}</p>
    </Placeholder>
  );
}
