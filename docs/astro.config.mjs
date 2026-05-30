// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

// Fully static export. `output: 'static'` is Astro's default; it is set
// explicitly here so the intent is obvious and `astro build` always emits a
// self-contained `./dist` you can drop on any static host or CDN.
//
// When you pick a home for the docs, set `site` to the canonical origin (used
// for sitemap + canonical URLs) and, if serving from a sub-path, set `base`.
export default defineConfig({
  site: 'https://example.com',
  base: '/',
  output: 'static',
  trailingSlash: 'always',
  integrations: [
    starlight({
      title: 'Beeper CLI',
      description:
        'One CLI for all your chats — WhatsApp, iMessage, Telegram, Signal, Discord and more, shaped for scripts, agents, and humans in a hurry.',
      tagline: 'One CLI for all your chats. Built for you and your agent.',
      logo: {
        src: './src/assets/logo.svg',
        replacesTitle: false,
      },
      social: [
        {
          icon: 'github',
          label: 'GitHub',
          href: 'https://github.com/beeper/desktop-api-cli',
        },
      ],
      editLink: {
        baseUrl:
          'https://github.com/beeper/desktop-api-cli/edit/main/docs/',
      },
      customCss: ['./src/styles/theme.css'],
      // Starlight ships full-text search (Pagefind) and dark mode by default.
      sidebar: [
        {
          label: 'Start here',
          items: [
            { label: 'Overview', link: '/' },
            { label: 'Install', link: '/install/' },
            { label: 'Connect a target', link: '/connect/' },
            { label: 'Quick start', link: '/quickstart/' },
          ],
        },
        {
          label: 'Targets & accounts',
          items: [
            { label: 'Targets', link: '/targets/' },
            { label: 'Bridges & accounts', link: '/accounts/' },
            { label: 'Auth & verification', link: '/auth/' },
          ],
        },
        {
          label: 'Messaging',
          items: [
            { label: 'Chats', link: '/chats/' },
            { label: 'Messages', link: '/messages/' },
            { label: 'Sending', link: '/send/' },
            { label: 'Contacts', link: '/contacts/' },
            { label: 'Media', link: '/media/' },
            { label: 'Export', link: '/export/' },
            { label: 'Presence', link: '/presence/' },
          ],
        },
        {
          label: 'Automation & agents',
          items: [
            { label: 'Output & scripting', link: '/scripting/' },
            { label: 'Watch (live events)', link: '/watch/' },
            { label: 'RPC', link: '/rpc/' },
            { label: 'Raw API access', link: '/api/' },
            { label: 'Exit codes', link: '/exit-codes/' },
          ],
        },
        {
          label: 'Reference',
          items: [
            { label: 'Configuration', link: '/config/' },
            { label: 'Plugins', link: '/plugins/' },
            { label: 'Updating', link: '/update/' },
            {
              label: 'Full command reference',
              link: 'https://github.com/beeper/desktop-api-cli/blob/main/packages/cli/README.md',
              attrs: { target: '_blank' },
            },
            {
              label: 'Desktop API reference',
              link: 'https://developers.beeper.com/desktop-api-reference',
              attrs: { target: '_blank' },
            },
          ],
        },
      ],
    }),
  ],
});
