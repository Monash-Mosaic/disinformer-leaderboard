# Real-Time Leaderboard Updates

## Fetching Techniques

Two common approaches are offset-based pagination (using `LIMIT` and `OFFSET`) and cursor-based pagination (using document references like `startAfter`).

**Source:** [Offset and Cursor Pagination Explained](https://dev.to/jackmarchant/offset-and-cursor-pagination-explained-b89)

### Why Cursor-Based Over Offset?

**Performance Issues with Offset:** Offset-based queries (e.g., `query(baseQuery, limit(10), offset(20))`) charge for documents skipped using offset.

**Source:** [Firestore Pagination and Cost](https://medium.com/@vharigandhi/firestore-pagination-and-cost-a2cb4ce36353)

**Additional Sources:** [Firestore Query Cursors](https://firebase.google.com/docs/firestore/query-data/query-cursors)

### Implementation Logic

Cursor-based pagination works like a bookmark. If each page limits to 10 items and you want to go to page 10, instead of telling the database "skip 100 items," you provide the exact reference (the cursor) where the start of page 10 is.

In practice (using Firestore as the example):

- **The Cursor:** A document snapshot or ID representing the boundary of a page. The cursor for a page is effectively marked by the end (last item) of the previous page.
- **The Query:** Uses `startAfter(doc)` or `endBefore(doc)` to anchor the fetch.
- **The Cache:** A `CursorCache` stores these anchors for each page, allowing the user to "jump" or navigate without re-scanning previous data.

#### Limitations

- Only allows sequential navigation: 1 -> 2 -> 3 -> ..., not random access: 1 -> 5 -> 3 -> ...

#### Workaround: Implement Prefetch Cursors Around

- **Prefetch Window:** Ranges to prefetch cursors from the current page being accessed. Limit the amount to prefetch to avoid prefetching all cursors (inefficient as it requires reading/scanning the entire DB). Fetched cursors will be cached.
- **Smart Navigation Direction Detection:** Used to figure out fetch direction.
  - Forward fetch: For the first page 1 with window of 3: fetch 1 -> 2 -> 3 -> 4
  - Backward fetch: For the last page 10 with window of 3: fetch 10 -> 9 -> 8 -> 7 -> 6
  - Bi-directional fetch: Both forward and backward, for pages in the middle with window of 3: 1 <- 2 <- 3 <- 4 <- 5 -> 6 -> 7 -> 8 -> 9
- **Caching:** Store every fetched cursor in a `CursorCache`. If a user clicks a nearby page, the anchor is retrieved instantly without a database scan.
- **UI Support:** Only allow random access 2 or 3 forward/backward, last page, and sequential navigation.
  ![Pagination UI](pagination_ui.png)
- **Fallback Logic:** If a user jumps to a page outside the cached window (e.g., via a URL query param), the system falls back to a background scan from the beginning to rebuild the cursor chain up to that point. This ensures random access works even with cache misses.
  ![URL Query Fallback](url_query.png)

## Indexes

![Index 1](index1.png)
![Index 2](index2.png)

