// @ts-check
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import rlc from "remark-link-card";

// https://astro.build/config
export default defineConfig({
	site: 'https://kanakana-rcj.github.io',
	integrations: [mdx(), sitemap()],

	markdown: {
		remarkPlugins: [rlc]
	}
});
