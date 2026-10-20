import { describe, expect, it } from 'vitest';

import { editorialExamples } from './story-examples';
import { getDestination } from '@globeguide/domain';

describe('editorial travel note examples', () => {
  it('contains a balanced set of original guides and moments', () => {
    expect(editorialExamples.length).toBeGreaterThanOrEqual(4);
    expect(editorialExamples.some((story) => story.type === 'guide')).toBe(true);
    expect(editorialExamples.some((story) => story.type === 'moment')).toBe(true);
    expect(new Set(editorialExamples.map((story) => story.id)).size).toBe(editorialExamples.length);
  });

  it('links every example to a known destination and an HTTPS reference', () => {
    for (const story of editorialExamples) {
      expect(getDestination(story.destinationId)).toBeDefined();
      expect(story.sourceUrl).toMatch(/^https:\/\//);
      expect(story.sourceLabel).toBeTruthy();
      expect(story.body).not.toMatch(/https?:\/\//);
    }
  });
});
