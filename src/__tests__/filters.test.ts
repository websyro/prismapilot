import { describe, it, expect } from "vitest";
import {
  buildRelationFilters,
  buildNotFilters,
  combineFilters,
  combineFiltersWithOr,
} from "../filters";

describe("Filters - Edge Cases", () => {
  it("combineFilters should return empty object for no inputs", () => {
    expect(combineFilters()).toEqual({});
  });

  it("combineFilters should wrap multiple filters in AND", () => {
    const result = combineFilters({ status: "ACTIVE" }, { isActive: true });
    expect(result).toEqual({ AND: [{ status: "ACTIVE" }, { isActive: true }] });
  });

  it("combineFiltersWithOr should return undefined for no filters", () => {
    const result = combineFiltersWithOr({}, {});
    expect(result).toBeUndefined();
  });

  it("combineFiltersWithOr should return single filter as-is", () => {
    const result = combineFiltersWithOr({ status: "ACTIVE" });
    expect(result).toEqual({ status: "ACTIVE" });
  });

  it("buildRelationFilters should ignore non-object values", () => {
    const result = buildRelationFilters({ user: null, org: "bad" } as any);
    expect(result).toEqual({});
  });

  it("buildRelationFilters should build nested filters", () => {
    const result = buildRelationFilters({ user: { isActive: true } });
    expect(result).toEqual({ user: { isActive: true } });
  });

  it("buildNotFilters should return undefined for empty filters", () => {
    const result = buildNotFilters({});
    expect(result).toBeUndefined();
  });

  it("buildNotFilters should wrap filters in NOT", () => {
    const result = buildNotFilters({ status: "DELETED" });
    expect(result).toEqual({ NOT: { status: "DELETED" } });
  });
});
