import { compareAsc, addDays } from 'date-fns';
import { SingleQuery } from '../types/query';

export const getRelevantQueries = (queries: SingleQuery[]) => {
  const now = new Date();
  const relevantQueries = [];

  for (const query of queries) {
    if (!query.nextRun || !query.interval) {
      continue;
    }
    const nextRun = Date.parse(query.nextRun);
    const interval = query.interval;
    if (compareAsc(addDays(nextRun, interval), now) <= 0) {
      relevantQueries.push(query);
    }
  }

  console.log('relevantQueries', relevantQueries);
  return relevantQueries;
};
