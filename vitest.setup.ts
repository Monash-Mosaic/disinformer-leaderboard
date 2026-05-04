import "@testing-library/jest-dom/vitest";

// Required for React 19 `use()` / Suspense under Vitest + Testing Library
(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
