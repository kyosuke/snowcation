import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";

const period = z.object({
  name: z.string(),
  kind: z.enum(["pre", "on", "spring"]),
  start: z.string(), // YYYY-MM-DD
  end: z.string(),
});

const closure = z.object({
  start: z.string(),
  end: z.string(),
  reason: z.string().optional(),
});

export const collections = {
  resorts: defineCollection({
    loader: glob({ pattern: "*.mdx", base: "./src/content/resorts" }),
    schema: ({ image }) =>
      z.object({
        title: z.string(),
        name: z.string(), // カード用の短い名前
        description: z.string(),
        summary: z.string(), // トップのカードに出す1文（45字以内）
        pref: z.string(),
        area: z.string(),
        order: z.number(), // 北→南
        image: image(),
        imageAlt: z.string(),
        note: z.string().optional(), // ヒーローに出す注意書き
        links: z.object({
          site: z.string().url(),
          map: z.object({ label: z.string(), url: z.string().url() }),
          status: z.string().url().optional(), // リフト運行状況。省略時は site
        }),
        facts: z.object({
          top: z.number(),
          base: z.number(),
          longest: z.number(),
          aspect: z
            .object({
              label: z.string(),
              dirs: z.array(z.enum(["N", "E", "S", "W"])),
              note: z.string(),
            })
            .optional(),
          slope: z.object({
            tags: z.array(z.string()),
            ratio: z.tuple([z.number(), z.number(), z.number()]).optional(),
            max: z.number().optional(),
          }),
          // arrival: 最短のホテル着。着いた日に滑れるリゾートだけ書く
          access: z.object({ hours: z.number(), note: z.string(), arrival: z.string().optional() }),
        }),
        // 先頭が最新シーズン。以降は過去シーズン（予定と実績）
        seasons: z.array(
          z.object({
            label: z.string(), // "26-27"
            areas: z.array(
              z.object({
                name: z.string().optional(),
                periods: z.array(period),
                closures: z.array(closure).default([]),
              }),
            ),
          }),
        ),
      }),
  }),
};
