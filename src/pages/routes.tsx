/**
 * Thin route components. Screens not yet built render a placeholder; each is
 * replaced by a real page in its phase (CLAUDE.md §8, §12).
 */
import { useCopy } from '../hooks/useCopy';
import { Placeholder } from './Placeholder';

export function NotFoundPage() {
  const copy = useCopy();
  return (
    <Placeholder title="Not Found" icon="form-warning" phase={0}>
      <p>{copy('notFound.body')}</p>
    </Placeholder>
  );
}
