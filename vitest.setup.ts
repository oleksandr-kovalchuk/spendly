import "@testing-library/jest-dom/vitest";
import { vi } from "vitest";

// These throw outside a Next request
vi.mock("next/cache", async (importOriginal) => ({
  ...(await importOriginal<typeof import("next/cache")>()),
  cacheLife: vi.fn(),
  cacheTag: vi.fn(),
  updateTag: vi.fn(),
  revalidateTag: vi.fn(),
  revalidatePath: vi.fn(),
  refresh: vi.fn(),
  navigation: vi.fn(() => Promise.resolve()),
  prefetch: vi.fn(() => Promise.resolve()),
}));

vi.mock("next/server", async (importOriginal) => ({
  ...(await importOriginal<typeof import("next/server")>()),
  after: vi.fn(),
  connection: vi.fn(() => Promise.resolve()),
}));
