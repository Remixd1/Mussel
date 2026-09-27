/**
 * Thin route components. Screens not yet built render a placeholder; each is
 * replaced by a real page in its phase (CLAUDE.md §8, §12).
 */
import { useParams } from 'react-router-dom';
import { useCopy } from '../hooks/useCopy';
import { Placeholder } from './Placeholder';

export function OnboardingPage() {
  return <Placeholder title="Subject Intake" icon="bodyweight" phase={1} />;
}

export function StatusPage() {
  const copy = useCopy();
  return (
    <Placeholder title="Facility Status" icon="rest" phase={1}>
      <p>{copy('home.empty')}</p>
    </Placeholder>
  );
}

export function SessionPage() {
  return <Placeholder title="Test in Progress" icon="squat" phase={1} />;
}

export function SessionSummaryPage() {
  const { id } = useParams();
  return <Placeholder title={`Printout ${id ?? ''}`} icon="pr" phase={1} />;
}

export function ArchivePage() {
  return <Placeholder title="Archive" icon="rest" phase={2} />;
}

export function SessionDetailPage() {
  const { id } = useParams();
  return <Placeholder title={`Session ${id ?? ''}`} icon="rest" phase={2} />;
}

export function LibraryPage() {
  return <Placeholder title="Protocol Library" icon="machine" phase={3} />;
}

export function ProtocolDetailPage() {
  const { exerciseId } = useParams();
  return <Placeholder title={`Protocol ${exerciseId ?? ''}`} icon="machine" phase={3} />;
}

export function PlansPage() {
  return <Placeholder title="Test Plans" icon="stretch" phase={4} />;
}

export function PlanEditorPage() {
  return <Placeholder title="Plan Editor" icon="stretch" phase={4} />;
}

export function BodyweightPage() {
  return <Placeholder title="Bodyweight Log" icon="bodyweight" phase={4} />;
}

export function CalibrationPage() {
  return <Placeholder title="Calibration" icon="machine" phase={1} />;
}

export function NotFoundPage() {
  const copy = useCopy();
  return (
    <Placeholder title="Not Found" icon="form-warning" phase={0}>
      <p>{copy('notFound.body')}</p>
    </Placeholder>
  );
}
