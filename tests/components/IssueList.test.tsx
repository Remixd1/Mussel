import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { IssueList } from '../../src/features/upload/IssueList';
import type { ImportIssue } from '../../src/lib/csv/issues';

const warning = { level: 'warning', message: 'Day 3 renumbered.' } as ImportIssue;
const error = { level: 'error', message: 'No Sets/Reps header found.' } as ImportIssue;

describe('IssueList announcements', () => {
  it('announces errors as an alert', () => {
    render(<IssueList issues={[warning, error]} />);
    expect(screen.getByRole('alert')).toHaveTextContent('No Sets/Reps header found.');
  });

  it('announces warnings politely', () => {
    render(<IssueList issues={[warning]} />);
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('Day 3 renumbered.');
  });
});
