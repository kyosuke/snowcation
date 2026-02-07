// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import astroD2 from 'astro-d2';
import Icons from 'unplugin-icons/vite';

import cloudflare from '@astrojs/cloudflare';

// https://astro.build/config
export default defineConfig({
    vite: {
        plugins: [
            Icons({
                compiler: 'astro',
            }),
        ],
    },
    integrations: [
        astroD2({
            layout: 'elk',
            theme: { default: '104', dark: '200' },
            experimental: { useD2js: true },
        }),
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