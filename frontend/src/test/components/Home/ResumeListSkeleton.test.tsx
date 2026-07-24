import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import ResumeListSkeleton from '@/components/Home/ResumeListSkeleton';

describe('ResumeListSkeleton', () => {
  it('displays three skeletons when no count is provided', () => {
    const { container } = render(<ResumeListSkeleton />);

    const skeletons = container.querySelectorAll(
      '[data-slot="skeleton"]',
    );

    expect(skeletons).toHaveLength(3);
  });

  it('displays the provided number of skeletons', () => {
    const count = 5;

    const { container } = render(
      <ResumeListSkeleton count={count} />,
    );

    const skeletons = container.querySelectorAll(
      '[data-slot="skeleton"]',
    );

    expect(skeletons).toHaveLength(count);
  });

  it('does not display skeletons when count is zero', () => {
    const { container } = render(
      <ResumeListSkeleton count={0} />,
    );

    const skeletons = container.querySelectorAll(
      '[data-slot="skeleton"]',
    );

    expect(skeletons).toHaveLength(0);
  });
});