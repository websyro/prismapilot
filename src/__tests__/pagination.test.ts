import { describe, it, expect } from "vitest";
import {
  getCursorPagination,
  processCursorResults,
  calculateTotalPages,
} from "../pagination";

describe("Pagination - Edge Cases", () => {
  it("getCursorPagination should use custom cursorField", () => {
    const result = getCursorPagination({ cursor: "c1", limit: 5, cursorField: "slug" });
    expect(result).toEqual({
      take: 6,
      skip: 1,
      cursor: { slug: "c1" },
    });
  });

  it("processCursorResults should use custom cursorField", () => {
    const results = [{ slug: "a" }, { slug: "b" }, { slug: "c" }];
    const processed = processCursorResults(results, 2, "slug");
    expect(processed.data).toEqual([{ slug: "a" }, { slug: "b" }]);
    expect(processed.hasMore).toBe(true);
    expect(processed.nextCursor).toBe("b");
  });

  it("calculateTotalPages should handle zero total", () => {
    const pages = calculateTotalPages(0, 10);
    expect(pages).toBe(0);
  });
});
