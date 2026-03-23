import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";
import { docsLoader } from "@astrojs/starlight/loaders";
import { docsSchema } from "@astrojs/starlight/schema";

export const collections = {
  docs: defineCollection({
    loader: docsLoader(),
    schema: docsSchema({
      extend: z.object({
        // Resort specific fields
        details: z
          .object({
            location: z.string(),
            elevation: z.string().optional(),
            courses: z.number().optional(),
            longest_run: z.string().optional(),
            max_gradient: z.string().optional(),
            facilities: z.array(z.string()).optional(),
          })
          .optional(),
        // Shared access field (Resort only now)
        access: z
          .object({
            train_hub: z.string().optional(),
            time_from_tokyo: z.string().optional(),
          })
          .optional(),
      }),
    }),
  }),
};
