import { describe, expect, test } from "bun:test";
import { APP_NAME } from "@/index";
import { VERSION } from "@/version";

describe("project setup", () => {
  test("APP_NAME is defined", () => {
    expect(APP_NAME).toBe("polybar-next-event");
  });

  test("path alias @/ resolves correctly", () => {
    expect(VERSION).toBe("0.1.0");
  });
});
