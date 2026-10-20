// Recency and closing are private per-user preferences, never shared thread metadata.
export function visibleConversationThreads(threads, preferences = {}, includeClosed = false) {
  return threads.filter(thread => {
    const preference = preferences[thread.id];
    return includeClosed || !preference?.closed || (thread.lastTimestamp || 0) > (preference.closedAt || 0);
  }).map(thread => ({ ...thread, _lastViewedAt: preferences[thread.id]?.lastViewedAt || 0 }))
    .sort((left, right) => Math.max(right.lastTimestamp || 0, right._lastViewedAt) - Math.max(left.lastTimestamp || 0, left._lastViewedAt));
}
