/// <reference types="node" />
import * as fs from "node:fs/promises";
import * as path from "node:path";
import type {
  FullConfig,
  FullResult,
  Reporter,
  Suite,
  TestCase,
  TestError,
  TestResult,
} from "@playwright/test/reporter";

/**
 * Jest-shaped report for tooling that already consumes `jest-results.json`
 * (see nori-demo `jest-html-report/jest-results.json`).
 */
type JestAssertionStatus = "passed" | "failed" | "pending" | "skipped";

interface JestAssertionResult {
  ancestorTitles: string[];
  duration: number;
  failureDetails: unknown[];
  failureMessages: string[];
  fullName: string;
  invocations: number;
  location: null;
  numPassingAsserts: number;
  retryReasons: unknown[];
  status: JestAssertionStatus;
  title: string;
}

interface JestFileResult {
  assertionResults: JestAssertionResult[];
  endTime: number;
  message: string;
  name: string;
  startTime: number;
  status: "passed" | "failed" | "pending";
  summary: string;
}

const EMPTY_SNAPSHOT = {
  added: 0,
  didUpdate: false,
  failure: false,
  filesAdded: 0,
  filesRemoved: 0,
  filesRemovedList: [] as string[],
  filesUnmatched: 0,
  filesUpdated: 0,
  matched: 0,
  total: 0,
  unchecked: 0,
  uncheckedKeysByFile: [] as unknown[],
  unmatched: 0,
  updated: 0,
};

function describeAncestors(test: TestCase): string[] {
  const tp = test.titlePath();
  if (tp.length < 3) return [];
  return tp.slice(2, -1);
}

function testTitleFromPath(test: TestCase): string {
  const tp = test.titlePath();
  return tp[tp.length - 1] ?? test.title;
}

function formatFailure(err: TestError): string {
  return err.stack || err.message || err.value || String(err);
}

function mapAssertionStatus(
  status: TestResult["status"],
): JestAssertionStatus {
  if (status === "passed") return "passed";
  if (status === "skipped") return "skipped";
  return "failed";
}

function fileStatus(assertions: JestAssertionResult[]): JestFileResult["status"] {
  const anyFailed = assertions.some((a) => a.status === "failed");
  if (anyFailed) return "failed";
  const allSkipped =
    assertions.length > 0 &&
    assertions.every((a) => a.status === "skipped");
  if (allSkipped) return "pending";
  return "passed";
}

function toAssertion(test: TestCase, result: TestResult): JestAssertionResult {
  const ancestorTitles = describeAncestors(test);
  const title = testTitleFromPath(test);
  const fullName =
    ancestorTitles.length > 0
      ? `${ancestorTitles.join(" ")} ${title}`
      : title;
  const status = mapAssertionStatus(result.status);
  const failureMessages = result.errors.map(formatFailure);
  return {
    ancestorTitles,
    duration: Math.round(result.duration),
    failureDetails: [] as unknown[],
    failureMessages,
    fullName,
    invocations: test.results.length,
    location: null,
    numPassingAsserts: status === "passed" ? 1 : 0,
    retryReasons: [] as unknown[],
    status,
    title,
  };
}

export default class JestJsonReporter implements Reporter {
  private readonly outputFile: string;
  private rootSuite: Suite | undefined;

  constructor(options: { outputFile?: string } = {}) {
    this.outputFile =
      options.outputFile ?? path.join("test-results", "playwright-results.json");
  }

  onBegin(_config: FullConfig, suite: Suite): void {
    this.rootSuite = suite;
  }

  async onEnd(result: FullResult): Promise<void> {
    if (!this.rootSuite) return;

    const allTests = this.rootSuite.allTests();
    const byFile = new Map<
      string,
      { cases: { test: TestCase; result: TestResult }[] }
    >();

    for (const test of allTests) {
      const res = test.results[test.results.length - 1];
      if (!res) continue;
      const file = path.resolve(test.location.file);
      let bucket = byFile.get(file);
      if (!bucket) {
        bucket = { cases: [] };
        byFile.set(file, bucket);
      }
      bucket.cases.push({ test, result: res });
    }

    const testResults: JestFileResult[] = [];

    for (const [file, { cases }] of byFile) {
      const sortedCases = cases
        .slice()
        .sort((x, y) => x.test.location.line - y.test.location.line);
      const sortedAssertions = sortedCases.map(({ test, result }) =>
        toAssertion(test, result),
      );

      const fStatus = fileStatus(sortedAssertions);
      const starts = cases.map((c) => c.result.startTime.getTime());
      const ends = cases.map(
        (c) => c.result.startTime.getTime() + c.result.duration,
      );

      testResults.push({
        assertionResults: sortedAssertions,
        endTime: Math.max(...ends, result.startTime.getTime()),
        message: fStatus === "failed"
          ? sortedAssertions
              .filter((a) => a.status === "failed")
              .flatMap((a) => a.failureMessages)
              .join("\n")
          : "",
        name: file,
        startTime: Math.min(...starts, result.startTime.getTime()),
        status: fStatus,
        summary: "",
      });
    }

    testResults.sort((a, b) => a.name.localeCompare(b.name));

    let numPassedTests = 0;
    let numFailedTests = 0;
    let numPendingTests = 0;
    for (const f of testResults) {
      for (const a of f.assertionResults) {
        if (a.status === "passed") numPassedTests++;
        else if (a.status === "failed") numFailedTests++;
        else numPendingTests++;
      }
    }

    const numFailedTestSuites = testResults.filter(
      (f) => f.status === "failed",
    ).length;
    const numPendingTestSuites = testResults.filter(
      (f) => f.status === "pending",
    ).length;
    const numPassedTestSuites = testResults.filter(
      (f) => f.status === "passed",
    ).length;
    const numTotalTestSuites = testResults.length;
    const numTotalTests = numPassedTests + numFailedTests + numPendingTests;

    const payload = {
      numFailedTestSuites,
      numFailedTests,
      numPassedTestSuites,
      numPassedTests,
      numPendingTestSuites,
      numPendingTests,
      numRuntimeErrorTestSuites: 0,
      numTodoTests: 0,
      numTotalTestSuites,
      numTotalTests,
      openHandles: [] as unknown[],
      snapshot: EMPTY_SNAPSHOT,
      startTime: result.startTime.getTime(),
      success: result.status === "passed",
      testResults,
      wasInterrupted: result.status === "interrupted",
    };

    const out = path.resolve(this.outputFile);
    await fs.mkdir(path.dirname(out), { recursive: true });
    await fs.writeFile(out, `${JSON.stringify(payload)}\n`, "utf8");
  }
}
