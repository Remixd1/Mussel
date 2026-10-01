import { issueLocation, type ImportIssue } from '../../lib/csv/issues';

/** Errors first, then warnings, each with its sheet location. */
export function IssueList({ issues }: { issues: readonly ImportIssue[] }) {
  if (!issues.length) return null;
  const sorted = [...issues].sort((a, b) =>
    a.level === b.level ? 0 : a.level === 'error' ? -1 : 1,
  );
  return (
    <ul className="issue-list" aria-label="Import notes">
      {sorted.map((issue, i) => {
        const where = issueLocation(issue);
        return (
          <li key={i} className={`issue issue--${issue.level}`}>
            <span className="issue__level">{issue.level === 'error' ? 'Error' : 'Note'}</span>
            <span>
              {issue.message}
              {where ? <span className="issue__where"> ({where})</span> : null}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
