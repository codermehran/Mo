import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach, afterAll, beforeAll } from "vitest";
import { resetMockData, server } from "./vitest.mocks";

beforeAll(() => server.listen());

afterEach(() => {
  resetMockData();
  server.resetHandlers();
  cleanup();
});

afterAll(() => server.close());
