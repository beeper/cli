package cli

import (
	"fmt"
	"os"
	"strings"

	beeperdesktopapi "github.com/beeper/desktop-api-go/v5"
	"github.com/beeper/desktop-api-go/v5/packages/param"
	"github.com/spf13/cobra"
)

const zshSemanticCompletion = `# beeper semantic completion (zsh) - source after static completion
_beeper_complete_kind() {
  local kind="$1"
  local -a lines
  local IFS=$'\n'
  lines=( $(beeper _complete "$kind" --query "$PREFIX" --limit 25 2>/dev/null) )
  local -a values descs
  for line in "$lines[@]"; do
    values+=("${line%%	*}")
    descs+=("${line}")
  done
  _describe -t "$kind" "$kind" descs values
}
_beeper_chat()    { _beeper_complete_kind chat }
_beeper_account() { _beeper_complete_kind account }
_beeper_target()  { _beeper_complete_kind target }
_beeper_contact() { _beeper_complete_kind contact }
compdef '_arguments \
  "--chat=[Chat ID or title]:chat:_beeper_chat" \
  "--to=[Chat or contact]:chat:_beeper_chat" \
  "--account=[Account]:account:_beeper_account" \
  "--target=[Target name]:target:_beeper_target" \
  "-t+[Target name]:target:_beeper_target"' beeper`

const bashSemanticCompletion = `# beeper semantic completion (bash) - source after static completion
_beeper_semantic_kind() {
  local kind="$1" cur="$2"
  local IFS=$'\n'
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
complete -o nospace -o default -F _beeper_semantic_dispatch beeper`

func newCompletionCommand(root *cobra.Command) *cobra.Command {
	cmd := &cobra.Command{
		Use:   "completion [bash|zsh|fish|powershell]",
		Short: "Generate shell completion scripts",
		Args:  cobra.MaximumNArgs(1),
		RunE: func(cmd *cobra.Command, args []string) error {
			shell := ""
			if len(args) > 0 {
				shell = args[0]
			}
			semantic, _ := cmd.Flags().GetBool("semantic")
			if semantic {
				return printSemanticCompletion(cmd, shell)
			}
			if shell == "" {
				shell = inferShell(os.Getenv("SHELL"))
			}
			switch shell {
			case "bash":
				return root.GenBashCompletion(cmd.OutOrStdout())
			case "zsh":
				return root.GenZshCompletion(cmd.OutOrStdout())
			case "fish":
				return root.GenFishCompletion(cmd.OutOrStdout(), true)
			case "powershell":
				return root.GenPowerShellCompletion(cmd.OutOrStdout())
			case "":
				return usageError("missing shell; use bash, zsh, fish, or powershell")
			default:
				return usageError("unsupported shell %q", shell)
			}
		},
	}
	cmd.Flags().BoolP("refresh-cache", "r", false, "Refresh the autocomplete cache before printing setup")
	cmd.Flags().Bool("semantic", false, "Print a semantic-completion snippet for bash or zsh")
	return cmd
}

func printSemanticCompletion(cmd *cobra.Command, shell string) error {
	if shell == "" {
		shell = inferShell(os.Getenv("SHELL"))
	}
	switch shell {
	case "zsh":
		fmt.Fprintln(cmd.OutOrStdout(), zshSemanticCompletion)
	case "bash":
		fmt.Fprintln(cmd.OutOrStdout(), bashSemanticCompletion)
	default:
		return usageError("semantic completion is currently supported for bash and zsh")
	}
	return nil
}

func inferShell(value string) string {
	base := strings.ToLower(value)
	if index := strings.LastIndex(base, "/"); index >= 0 {
		base = base[index+1:]
	}
	switch {
	case strings.Contains(base, "zsh"):
		return "zsh"
	case strings.Contains(base, "bash"):
		return "bash"
	case strings.Contains(base, "fish"):
		return "fish"
	case strings.Contains(base, "powershell"), strings.Contains(base, "pwsh"):
		return "powershell"
	default:
		return ""
	}
}

func newCompleteCommand(opts *globalOptions) *cobra.Command {
	cmd := &cobra.Command{
		Use:     "_complete [chat|account|target|contact]",
		Aliases: []string{"autocomplete"},
		Hidden:  true,
		Args:    cobra.ExactArgs(1),
		RunE: func(cmd *cobra.Command, args []string) error {
			query, _ := cmd.Flags().GetString("query")
			limit, _ := cmd.Flags().GetInt("limit")
			if limit <= 0 {
				limit = 25
			}
			return runSemanticComplete(opts, cmd, args[0], query, limit)
		},
	}
	cmd.Flags().String("query", "", "Completion query")
	cmd.Flags().Int("limit", 25, "Maximum suggestions")
	return cmd
}

func runSemanticComplete(opts *globalOptions, cmd *cobra.Command, kind string, query string, limit int) error {
	switch kind {
	case "target":
		cfg, err := readConfig()
		if err != nil {
			return err
		}
		targets, err := listTargets()
		if err != nil {
			return err
		}
		hasDesktop := false
		for _, target := range targets {
			if target.ID == builtInDesktopTarget {
				hasDesktop = true
				break
			}
		}
		if !hasDesktop {
			targets = append([]target{*builtInTarget(cfg)}, targets...)
		}
		count := 0
		for _, target := range targets {
			if !completionMatches(query, target.ID, target.Name, target.BaseURL, target.Type) {
				continue
			}
			fmt.Fprintf(cmd.OutOrStdout(), "%s\t%s %s\n", target.ID, target.Type, target.BaseURL)
			count++
			if count >= limit {
				break
			}
		}
		return nil
	case "chat", "account", "contact":
		client, ctx, cancel, err := newClient(opts)
		if err != nil {
			return err
		}
		defer cancel()
		switch kind {
		case "chat":
			pager := client.Chats.SearchAutoPaging(ctx, beeperdesktopapi.ChatSearchParams{
				Query: param.NewOpt(query),
				Scope: beeperdesktopapi.ChatSearchParamsScopeTitles,
				Limit: param.NewOpt(int64(limit)),
			})
			count := 0
			for pager.Next() {
				chat := pager.Current()
				value := chatInputID(chat)
				fmt.Fprintf(cmd.OutOrStdout(), "%s\t%s\n", value, chat.Title)
				count++
				if count >= limit {
					break
				}
			}
			return pager.Err()
		case "account":
			accounts, err := client.Accounts.List(ctx)
			if err != nil {
				return err
			}
			count := 0
			for _, account := range *accounts {
				if !completionMatches(query, account.AccountID, account.Network, account.Bridge.ID, account.Bridge.Type, account.User.FullName, account.User.Username, account.User.Email) {
					continue
				}
				fmt.Fprintf(cmd.OutOrStdout(), "%s\t%s %s\n", account.AccountID, account.Network, firstNonEmpty(account.User.FullName, account.User.Username, account.User.ID))
				count++
				if count >= limit {
					break
				}
			}
			return nil
		case "contact":
			accountIDs, err := contactAccountIDs(ctx, client, nil)
			if err != nil {
				return err
			}
			count := 0
			for _, accountID := range accountIDs {
				pager := client.Accounts.Contacts.ListAutoPaging(ctx, accountID, beeperdesktopapi.AccountContactListParams{
					Query: param.NewOpt(query),
					Limit: param.NewOpt(int64(limit)),
				})
				for pager.Next() {
					user := pager.Current()
					fmt.Fprintf(cmd.OutOrStdout(), "%s\t%s\n", user.ID, firstNonEmpty(user.FullName, user.Username, user.Email))
					count++
					if count >= limit {
						break
					}
				}
				if err := pager.Err(); err != nil {
					return err
				}
				if count >= limit {
					break
				}
			}
			return nil
		}
	}
	return usageError("unsupported completion kind %q", kind)
}

func completionMatches(query string, values ...string) bool {
	normalized := normalizeSelector(query)
	if normalized == "" {
		return true
	}
	for _, value := range values {
		if strings.Contains(normalizeSelector(value), normalized) {
			return true
		}
	}
	return false
}
