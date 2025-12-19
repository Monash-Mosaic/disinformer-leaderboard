# Real-Time Leaderboard Updates

## Overview
Real-time updates allow the UI to reflect database changes immediately without page reloads using Firebase Firestore's `onSnapshot()` listener.

## How It Works

**The Pattern:**
- Firestore's `onSnapshot()` establishes a persistent WebSocket connection to the database
- Whenever ANY player document changes (score, rank, etc.), Firestore triggers the listener callback
- Callback receives a snapshot with ALL current documents matching the query
- Extract current page data (10 items) from the full snapshot
- Update React state -> component re-renders with new data

**Change Detection Flow:**
```
Database Write -> Query Re-evaluation -> Snapshot Generated -> 
Listener Callback Triggered -> Data Processed -> State Updated -> UI Re-renders
```

## Implementation

**Function:** `subscribeToLeaderboardWithPagination()` in [services/leaderboard-service.ts](../services/leaderboard-service.ts)

```typescript
export function subscribeToLeaderboardWithPagination(
    pageNumber: number,
    mode: RankingCriteria,
    onUpdate: (result: LeaderboardPageResult) => void,
    onError: (error: Error) => void,
    searchTerm?: string
): () => void
```

**What it does:**
1. Builds a base query with all filters (mode, search term, sorting)
2. Attaches `onSnapshot()` listener (listens to ENTIRE leaderboard, not just current page)
3. On each snapshot:
   - Deserialize all documents to Player objects
   - Slice out current page (items 40-50 for page 5, etc.)
   - Update cursor cache at page boundaries
   - Invoke callback with paginated result

**React Integration** in [LeaderboardTableCursorBased.tsx](../components/leaderboard/LeaderboardTableCursorBased.tsx):

```typescript
useEffect(() => {
    const unsub = subscribeToLeaderboardWithPagination(
        currentPage, mode,
        (result) => setData(result),  // Update state when snapshot arrives
        (err) => setError(err.message)
    );
    return () => unsub();  // Cleanup on unmount
}, [currentPage, mode, searchTerm]);  // New listener if dependencies change
```

## Key Features

### Page-Aware Updates
- Listens to entire leaderboard but extracts only current page
- Only data for current page updates (page 5 sees players 41-50)
- Efficient: no need to update entire table

### Dynamic Pagination
- If player count changes, total pages auto-adjust
- Moving to invalid page redirects to last page
- New pages added dynamically as players join

### Cursor Cache Sync
- On each update, cursor cache is refreshed at page boundaries
- Enables instant navigation to nearby pages (no fetch needed)
- Cached cursors survive real-time updates

### Respects Context
- **Search Filtering**: Only updates match the current search
- **Mode Switching**: Each mode (Disinformer/Netizen) has its own ranking
- **Configuration**: Can enable/disable with `enableRealtime` prop


## Subscription Lifecycle

| Event | Action |
|-------|--------|
| Component Mount | Create listener with current page/mode |
| `currentPage` Changes | Unsubscribe old, create new listener |
| `mode` Changes | Unsubscribe old, create new listener |
| `searchTerm` Changes | Unsubscribe old, create new listener |
| Component Unmount | Unsubscribe, cleanup |

**Note:** Old listener always unsubscribed before new one created (prevents duplicates).

## Limitations & Future Improvements

**Current Limitation:**
- Listener monitors entire leaderboard (inefficient for millions of players)
- Full snapshot sent even if only checking current page

**Why it's a problem:**

### 1. Read Cost
- **Initial Snapshot:** Reads ALL documents (10,000 players = 10,000 read operations)
- **Subsequent updates:** Only charges for documents that changed (1 player update = 1 read billed)
source: https://stackoverflow.com/questions/74752683/are-only-the-changes-being-charged-on-firestore-onsnapshot


### 2. Client Performance (The Real Problem)
- **Bandwidth:** Every update sends the entire snapshot (all 10,000 documents) to the client
- **CPU/Memory:** Code processes ALL documents on EVERY update:
  ```typescript
  snapshot.docs.map(serializePlayer);     // Maps 10,000 docs
  snapshot.docs.forEach((doc, index) => { // Iterates 10,000 docs

**Proposed Optimizations:**
- Page-range listeners: Only subscribe to pages around current position
- Batch updates: Debounce rapid changes to reduce re-renders
- Incremental sync: Send only changed documents instead of full snapshot
- Lazy loading: Prefetch adjacent pages in background
