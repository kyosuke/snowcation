import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';
import { docsLoader } from '@astrojs/starlight/loaders';
import { docsSchema } from '@astrojs/starlight/schema';

export const collections = {
	docs: defineCollection({
		loader: docsLoader(),
		schema: docsSchema({
			extend: z.object({
				// Resort specific fields
				details: z.object({
					location: z.string(),
					elevation: z.string().optional(),
					courses: z.number().optional(),
					longest_run: z.string().optional(),
					max_gradient: z.string().optional(),
					facilities: z.array(z.string()).optional(),
				}).optional(),
				// Shared access field (Resort only now)
				access: z.object({
					train_hub: z.string().optional(),
					time_from_tokyo: z.string().optional(),
				}).optional(),
			}),
		}),
	}),
	hotels: defineCollection({
		loader: glob({ pattern: '**/*.{md,mdx}', base: "./src/content/hotels" }),
		schema: z.object({
			title: z.string(),
			parent_resort: z.string(),
			access: z.object({
				from_hub: z.string().optional(),
				shuttle: z.boolean().optional(),
			}).optional(),
			work_env: z.object({
				wifi: z.string(),
				desk: z.string().optional(),
				chair: z.string().optional(),
				meeting_space: z.string().optional(),
				monitor_rental: z.boolean().optional(),
			}).optional(),
			living_env: z.object({
				convenience_store: z.string().optional(),
				restaurants: z.string().optional(),
				laundry: z.string().optional(),
				delivery: z.string().optional(),
			}).optional(),
			onsen: z.object({
				available: z.boolean(),
				type: z.string().optional(),
				sauna: z.boolean().optional(),
			}).optional(),
			cost: z.object({
				solo_allowed: z.boolean().optional(),
				approx_price: z.string().optional(),
				lift_ticket_deal: z.string().optional(),
			}).optional(),
		}),
	}),
};
