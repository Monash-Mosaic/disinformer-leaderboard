1. Fetching techniques
Two common approaches are offset-based pagination (using LIMIT and OFFSET) and cursor-based pagination (using document references like startAfter). 
source: https://dev.to/jackmarchant/offset-and-cursor-pagination-explained-b89

- Why Cursor-Based Over Offset?
Performance Issues with Offset: Offset-based queries (e.g., query(baseQuery, limit(10), offset(20))) we will be charged for documents we skipped using offset
source: https://medium.com/@vharigandhi/firestore-pagination-and-cost-a2cb4ce36353

sources: https://firebase.google.com/docs/firestore/query-data/query-cursors

- The Implementation Logic
Cursor-based pagination works like a bookmark. If each page limit to 10 items and you want to go to page 10, instead of telling the database "skip 100 items," you provide the exact reference (the cursor) where is the start of page 10.

In practice (using Firestore as the example):

The Cursor: A document snapshot or ID representing the boundary of a page. The cursor for a page is effectively marked by the end (last item) of the previous page

The Query: Uses startAfter(doc) or endBefore(doc) to anchor the fetch.

The Cache: A CursorCache stores these anchors for each page, allowing the user to "jump" or navigate without re-scanning previous data.

Limitation:
- only allow sequential navigation: 1->2->3->..., not random access: 1->5->3->...

Workaround:
- Imeplement prefetch cursors around
    + prefetch window (ranges to prefetch cursor from current page being accessed)
        limit amount to prefetch, avoid prefetching all cursors (ineffiecnent as needing to read/scan the entire db), cursor fetched will be cached
    + smart navigation direction detection: used to figure fetch direction
        foward fetch: for page first page 1 with window of 3: fetch 1->2->3->4
        backward fetch: for last page 10 with window of 3: fetch 10->9->8->7->6
        bi-directional fetch: both forward and backward, for pages in the middle with window of 3: 1<-2<-3<-4<-5->6->7->8->9
    + Caching: Store every fetched cursor in a CursorCache. If a user clicks a nearby page, the anchor is retrieved instantly without a database scan.
    + supported by UI, only allow random access 2 or 3 forward/backward and last page and sequential navigation.
    ![alt text](pagination_ui.png)
    + Fallback Logic: If a user jumps to a page outside the cached window (e.g., via a URL query param), the system falls back to a background scan from the beginning to rebuild the cursor chain up to that point. Ensure random access works even with cache misses.
    ![alt text](url_query.png)

Indexes:
![alt text](index1.png)
![alt text](index2.png)

