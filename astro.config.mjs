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
            // 県グループは北→南の順に並べる
            sidebar: [
                {
                    label: '青森県',
                    items: [
                        { slug: 'resorts/aomori-spring' },
                    ],
                },
                {
                    label: '秋田県',
                    items: [
                        { slug: 'resorts/tazawako' },
                    ],
                },
                {
                    label: '宮城県',
                    items: [
                        { slug: 'resorts/onikoube' },
                    ],
                },
                {
                    label: '福島県',
                    items: [
                        { slug: 'resorts/grandeco' },
                        { slug: 'resorts/nekoma-mountain' },
                    ],
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