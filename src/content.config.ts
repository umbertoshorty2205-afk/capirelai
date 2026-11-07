import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";

const articleSchema = z.object({
  titolo: z.string(),
  descrizione: z.string(),
  data: z.coerce.date(),
  autore: z.string(),
});

export const collections = {
  concetti: defineCollection({
    loader: glob({ pattern: "**/*.md", base: "./src/content/concetti" }),
    schema: articleSchema,
  }),
  guide: defineCollection({
    loader: glob({ pattern: "**/*.md", base: "./src/content/guide" }),
    schema: articleSchema,
  }),
  prove: defineCollection({
    loader: glob({ pattern: "**/*.md", base: "./src/content/prove" }),
    schema: articleSchema,
  }),
  aggiornamenti: defineCollection({
    loader: glob({ pattern: "**/*.md", base: "./src/content/aggiornamenti" }),
    schema: articleSchema,
  }),
};