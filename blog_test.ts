// Copyright 2022 the Deno authors. All rights reserved. MIT license.

import { configureBlog, createBlogHandler, redirects } from "./blog.tsx";
import {
  assert,
  assertEquals,
  assertStringIncludes,
} from "https://deno.land/std@0.153.0/testing/asserts.ts";
import { fromFileUrl, join } from "https://deno.land/std@0.153.0/path/mod.ts";

const BLOG_URL = new URL("./blogs/main.js", import.meta.url).href;
const TESTDATA_PATH = fromFileUrl(new URL("./blogs/", import.meta.url));
const BLOG_SETTINGS = await configureBlog(BLOG_URL, false, {
  author: "The author",
  title: "Test blog",
  description: "This is some description.",
  lang: "en-GB",
  middlewares: [
    redirects({
      "/to_hello": "hello",
      "/to_hello_with_slash": "/hello",
      "hello.html": "hello",
    }),
  ],
  readtime: true,
});
const CONN_INFO = {
  localAddr: {
    transport: "tcp" as const,
    hostname: "0.0.0.0",
    port: 8000,
  },
  remoteAddr: {
    transport: "tcp" as const,
    hostname: "0.0.0.0",
    port: 8001,
  },
};

const blogHandler = createBlogHandler(BLOG_SETTINGS);
const testHandler = (req: Request): Response | Promise<Response> => {
  return blogHandler(req, CONN_INFO);
};

Deno.test("index page", async () => {
  const resp = await testHandler(new Request("https://blog.deno.dev"));
  assert(resp);
  assertEquals(resp.status, 200);
  assertEquals(resp.headers.get("content-type"), "text/html; charset=utf-8");
  const body = await resp.text();
  assertStringIncludes(body, `<html lang="en-GB">`);
  // assertStringIncludes(body, `rony-y`);
  // assertStringIncludes(body, `Chitty Chitty Chat Chat, Chit Chat.`);
});

Deno.test("posts/ hello", async () => {
  const resp = await testHandler(new Request("https://blog.deno.dev/hello"));
  assert(resp);
  assertEquals(resp.status, 200);
  assertEquals(resp.headers.get("content-type"), "text/html; charset=utf-8");
  const body = await resp.text();
  assertStringIncludes(body, `<html lang="en-GB">`);
  assertStringIncludes(body, `Hello`);
  assertStringIncludes(body, `9bany`);
  assertStringIncludes(
    body,
    `<time dateTime="2023-01-02T00:00:00.000Z">`,
  );
  assertStringIncludes(body, `<p>Lorem Ipsum is simply dummy text`);
});

Deno.test("posts/ trailing slash redirects", async () => {
  const resp = await testHandler(new Request("https://blog.deno.dev/second/"));
  assert(resp);
  assertEquals(resp.status, 307);
  assertEquals(resp.headers.get("location"), "https://blog.deno.dev/second");
  await resp.text();
});

Deno.test("redirect map", async () => {
  {
    const resp = await testHandler(
      new Request("https://blog.deno.dev/hello.html"),
    );
    assert(resp);
    assertEquals(resp.status, 307);
    assertEquals(resp.headers.get("location"), "/hello");
    await resp.text();
  }
});

Deno.test("static files in root directory", async () => {
  const resp = await testHandler(new Request("https://blog.deno.dev/cat.png"));
  assert(resp);
  assertEquals(resp.status, 200);
  assertEquals(resp.headers.get("content-type"), "image/png");
  const bytes = new Uint8Array(await resp.arrayBuffer());
  assertEquals(
    bytes,
    await Deno.readFile(
      join(TESTDATA_PATH, "./cat.png"),
    ),
  );
});

Deno.test("RSS feed", async () => {
  const resp = await testHandler(new Request("https://blog.deno.dev/feed"));
  assert(resp);
  assertEquals(resp.status, 200);
  assertEquals(
    resp.headers.get("content-type"),
    "application/atom+xml; charset=utf-8",
  );
  const body = await resp.text();
  assertStringIncludes(body, `Hello`);
  assertStringIncludes(body, `https://blog.deno.dev/hello`);
});
