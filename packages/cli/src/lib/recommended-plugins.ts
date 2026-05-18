export type RecommendedPlugin = {
  commands: string[]
  description: string
  install: string
  name: string
}

export const recommendedPlugins: RecommendedPlugin[] = [
  {
    commands: ['targets tunnel'],
    description: 'Expose a selected Beeper target through Cloudflare Tunnel',
    install: 'beeper plugins install @beeper/cli-plugin-cloudflare',
    name: '@beeper/cli-plugin-cloudflare',
  },
]
