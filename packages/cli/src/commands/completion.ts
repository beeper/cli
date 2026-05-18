import { Args, Command, Flags } from '@oclif/core'

const ZSH_SNIPPET = `# beeper semantic completion (zsh) — source after \`beeper autocomplete\`
# Augments static command completion with live suggestions for --chat / --to / --account / --target.
_beeper_complete_kind() {
  local kind="$1"
  local -a lines
  local IFS=$'\\n'
  lines=( $(beeper _complete "$kind" --query "$PREFIX" --limit 25 2>/dev/null) )
  local -a values descs
  for line in "$lines[@]"; do
    values+=("$\{line%%\\t*\}")
    descs+=("$\{line\}")
  done
  _describe -t "$kind" "$kind" descs values
}
_beeper_chat()    { _beeper_complete_kind chat }
_beeper_account() { _beeper_complete_kind account }
_beeper_target()  { _beeper_complete_kind target }
_beeper_contact() { _beeper_complete_kind contact }

zstyle ':completion:*:*:beeper:*:option-chat-1'    extra-verbose yes
compdef '_arguments \\
  "--chat=[Chat ID or title]:chat:_beeper_chat" \\
  "--to=[Chat or contact]:chat:_beeper_chat" \\
  "--account=[Account]:account:_beeper_account" \\
  "--target=[Target name]:target:_beeper_target" \\
  "-t+[Target name]:target:_beeper_target"' beeper
`

const BASH_SNIPPET = `# beeper semantic completion (bash) — source after \`beeper autocomplete\`
# Augments static command completion with live suggestions for --chat / --to / --account / --target.
_beeper_semantic_kind() {
  local kind="$1" cur="$2"
  local IFS=$'\\n'
  COMPREPLY+=( $(beeper _complete "$kind" --query "$cur" --limit 25 2>/dev/null | cut -f1) )
}
_beeper_semantic_dispatch() {
  local prev="$3" cur="$2"
  case "$prev" in
    --chat|--to)        _beeper_semantic_kind chat    "$cur" ;;
    --account)          _beeper_semantic_kind account "$cur" ;;
    --target|-t)        _beeper_semantic_kind target  "$cur" ;;
    --contact)          _beeper_semantic_kind contact "$cur" ;;
  esac
}
# Chain after the static beeper completion: call it, then add semantic suggestions.
complete -o nospace -o default -F _beeper_semantic_dispatch beeper
`

export default class Completion extends Command {
  static override summary = 'Print shell completion setup (alias for autocomplete)'
  static override description = `Same as \`beeper autocomplete\`: prints setup instructions and the generated completion script for the requested shell.

Pass \`--semantic\` to print a small supplementary snippet that adds live suggestions for \`--chat\`, \`--to\`, \`--account\`, and \`--target\` by calling back into \`beeper _complete\`. Source it *after* the static autocomplete setup.`
  static override args = {
    shell: Args.string({ description: 'Shell to set up (bash, zsh, fish, or powershell)', required: false }),
  }
  static override flags = {
    'refresh-cache': Flags.boolean({ char: 'r', default: false, description: 'Refresh the autocomplete cache before printing setup' }),
    semantic: Flags.boolean({ default: false, description: 'Print a semantic-completion snippet (chats/accounts/targets) for bash or zsh' }),
  }

  async run(): Promise<void> {
    const { args, flags } = await this.parse(Completion)
    if (flags.semantic) {
      const shell = (args.shell ?? process.env.SHELL ?? '').toLowerCase()
      if (shell.includes('zsh')) {
        process.stdout.write(`${ZSH_SNIPPET}\n`)
        return
      }
      if (shell.includes('bash')) {
        process.stdout.write(`${BASH_SNIPPET}\n`)
        return
      }
      process.stderr.write('Semantic completion is currently supported for bash and zsh. Pass `bash` or `zsh` explicitly.\n')
      this.exit(2)
    }
    const argv: string[] = []
    if (args.shell) argv.push(args.shell)
    if (flags['refresh-cache']) argv.push('--refresh-cache')
    await this.config.runCommand('autocomplete', argv)
  }
}
