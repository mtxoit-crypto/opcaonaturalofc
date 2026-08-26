import assert from "node:assert/strict";
import { test } from "node:test";
import { assertMediaFile, assertVideoUrl, mediaTypeFor, partitionMediaFiles } from "./media-validation.ts";

function file(name: string, type: string, size = 1) {
  return { name, type, size } as File;
}

test("partitions GLB files without treating them as videos", () => {
  const result = partitionMediaFiles([
    file("pote.glb", "model/gltf-binary"),
    file("pote.mp4", "video/mp4"),
    file("pote.webp", "image/webp"),
    file("pote.gltf", "model/gltf+json"),
  ]);

  assert.equal(mediaTypeFor(file("pote.glb", "")), "model");
  assert.equal(result.models.length, 1);
  assert.equal(result.videos.length, 1);
  assert.equal(result.images.length, 1);
  assert.equal(result.invalid.length, 1);
});

test("validates GLB size and extension", () => {
  assert.equal(assertMediaFile(file("pote.glb", "")), "model");
  assert.throws(
    () => assertMediaFile(file("pote.gltf", "model/gltf+json")),
    /use um modelo \.glb/i,
  );
  assert.throws(
    () => assertMediaFile(file("pote.glb", "model/gltf-binary", 50 * 1024 * 1024 + 1)),
    /até 50 MB/i,
  );
});

test("accepts only HTTPS direct video URLs", () => {
  assert.equal(assertVideoUrl("https://cdn.example.com/product.mp4"), "https://cdn.example.com/product.mp4");
  assert.throws(() => assertVideoUrl("http://cdn.example.com/product.mp4"), /https/i);
  assert.throws(() => assertVideoUrl("https://youtube.com/watch?v=abc"), /mp4|webm/i);
});
