// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import mermaid from 'astro-mermaid';

import cloudflare from '@astrojs/cloudflare';

// https://astro.build/config
export default defineConfig({
    integrations: [
        mermaid(),
        starlight({
            title: 'Snowcation',
            defaultLocale: 'ja',
            social: [{ icon: 'github', label: 'GitHub', href: 'https://github.com/kyosuke/snowcation' }],
            sidebar: [
                {
                    label: 'スキー場',
                    autogenerate: { directory: 'resorts' },
                },
            ],
        }),
    ],

    adapter: cloudflare({
        platformProxy: {
            enabled: true
        },

        imageService: "cloudflare"
    }),
});