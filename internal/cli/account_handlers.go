package cli

import (
	"bufio"
	"context"
	"fmt"
	"io"
	"os"
	"strings"

	beeperdesktopapi "github.com/beeper/desktop-api-go/v5"
	"github.com/beeper/desktop-api-go/v5/packages/param"
	"github.com/beeper/desktop-api-go/v5/shared"
	"github.com/spf13/cobra"
)

func addAccountFlags(cmd *cobra.Command, spec commandSpec) {
	switch spec.Name {
	case "accounts", "accounts:list":
		cmd.Flags().StringArray("account", nil, "Filter by account selector")
		cmd.Flags().Bool("ids", false, "Print only account IDs")
	case "accounts:show", "accounts:use", "accounts:remove":
		cmd.Flags().String("account", "", "Account selector: account ID, network, bridge, or account user")
	case "contacts", "contacts:list":
		cmd.Flags().StringArray("account", nil, "Limit to account selector")
		cmd.Flags().Bool("ids", false, "Print only contact user IDs")
		cmd.Flags().Int("limit", 20, "Maximum contacts to print")
		cmd.Flags().String("query", "", "Optional blended contact lookup query")
	case "contacts:search":
		cmd.Flags().StringArray("account", nil, "Account selector. Omit to search every account.")
	case "contacts:show":
		cmd.Flags().StringArray("account", nil, "Limit to account selector")
	}
}

func runAccountCommand(opts *globalOptions, spec commandSpec, cmd *cobra.Command, args []string) error {
	client, ctx, cancel, err := newClient(opts)
	if err != nil {
		return err
	}
	defer cancel()

	switch spec.Name {
	case "accounts", "accounts:list":
		accounts, err := client.Accounts.List(ctx)
		if err != nil {
			return err
		}
		accountSelectors, _ := cmd.Flags().GetStringArray("account")
		rows := *accounts
		if len(accountSelectors) > 0 {
			rows = []beeperdesktopapi.Account{}
			seen := map[string]bool{}
			for _, selector := range accountSelectors {
				matches := matchAccounts(*accounts, selector)
				if len(matches) == 0 {
					return usageError("no account matches %q", selector)
				}
				for _, account := range matches {
					if account.AccountID != "" && !seen[account.AccountID] {
						rows = append(rows, account)
						seen[account.AccountID] = true
					}
				}
			}
		}
		if ids, _ := cmd.Flags().GetBool("ids"); ids {
			values := make([]string, 0, len(rows))
			for _, account := range rows {
				values = append(values, account.AccountID)
			}
			return printData(opts, values)
		}
		return printData(opts, rows)
	case "accounts:show":
		accountID, err := resolveAccountID(ctx, client, firstArgOrFlag(cmd, args, "account"))
		if err != nil {
			return err
		}
		if accountID == "" {
			return usageError("missing account ID")
		}
		account, err := client.Accounts.Get(ctx, accountID)
		if err == nil {
			return printData(opts, account)
		}
		accounts, listErr := client.Accounts.List(ctx)
		if listErr != nil {
			return err
		}
		for _, account := range *accounts {
			if account.AccountID == accountID {
				return printData(opts, account)
			}
		}
		return usageError("account not found: %s", accountID)
	case "accounts:use":
		accountID := firstArgOrFlag(cmd, args, "account")
		cfg, err := readConfig()
		if err != nil {
			return err
		}
		if accountID == "" {
			cfg.DefaultAccount = ""
			if err := writeConfig(cfg); err != nil {
				return err
			}
			return printData(opts, map[string]any{"defaultAccount": ""})
		}
		resolved, err := resolveAccountID(ctx, client, accountID)
		if err != nil {
			return err
		}
		cfg.DefaultAccount = resolved
		if err := writeConfig(cfg); err != nil {
			return err
		}
		return printData(opts, map[string]any{"accountID": resolved})
	case "accounts:add":
		bridgeID := ""
		if len(args) > 0 {
			bridgeID = args[0]
		}
		nonInteractive, _ := cmd.Flags().GetBool("non-interactive")
		guided, _ := cmd.Flags().GetBool("guided")
		webview, _ := cmd.Flags().GetBool("webview")
		if webview || firstFlag(cmd, "webview-backend") != "" || flagChanged(cmd, "webview-timeout") {
			return usageError("accounts add WebView management is not available in the Go CLI; pass --cookie values or run without WebView flags")
		}
		if bridgeID == "" {
			bridges, err := client.Bridges.List(ctx)
			if err != nil {
				return err
			}
			if opts.JSON {
				return printData(opts, bridges)
			}
			if guided && !nonInteractive && stdinIsTTY() {
				selected, err := chooseBridge(cmd.InOrStdin(), cmd.OutOrStdout(), bridges.Items)
				if err != nil {
					return err
				}
				bridgeID = selected
			} else {
				printAvailableBridges(cmd.OutOrStdout(), bridges.Items)
				return nil
			}
		}
		bridges, err := client.Bridges.List(ctx)
		if err != nil {
			return err
		}
		bridge, err := resolveBridge(bridges.Items, bridgeID)
		if err != nil {
			return err
		}
		if bridge.Status != beeperdesktopapi.BridgeStatusAvailable {
			suffix := ""
			if bridge.StatusText != "" {
				suffix = ": " + bridge.StatusText
			}
			return usageError("%s is not available%s", bridge.DisplayName, suffix)
		}
		flowID := firstFlag(cmd, "flow")
		if flowID == "" {
			flows, err := client.Bridges.LoginFlows.List(ctx, bridge.ID)
			if err != nil {
				return err
			}
			if len(flows.Items) > 1 {
				if guided && !opts.JSON && !nonInteractive {
					flowID, err = chooseLoginFlow(cmd.InOrStdin(), cmd.OutOrStdout(), flows.Items)
					if err != nil {
						return err
					}
				} else {
					return usageError("Multiple sign-in methods are available for %s. Pass --flow.", bridge.DisplayName)
				}
			} else if len(flows.Items) == 1 {
				flowID = flows.Items[0].ID
			}
			if flowID == "" {
				return usageError("No login flows returned for %s.", bridge.DisplayName)
			}
		}
		params := beeperdesktopapi.BridgeLoginSessionNewParams{FlowID: param.NewOpt(flowID)}
		if loginID := firstFlag(cmd, "login-id"); loginID != "" {
			params.LoginID = param.NewOpt(loginID)
		}
		res, err := client.Bridges.LoginSessions.New(ctx, bridge.ID, params)
		if err != nil {
			return err
		}
		if guided {
			cookieFlags, _ := cmd.Flags().GetStringArray("cookie")
			fieldFlags, _ := cmd.Flags().GetStringArray("field")
			cookies, err := parseKeyValueFlags(cookieFlags, "--cookie")
			if err != nil {
				return err
			}
			fields, err := parseKeyValueFlags(fieldFlags, "--field")
			if err != nil {
				return err
			}
			res, err = runGuidedAccountLogin(ctx, client, cmd.InOrStdin(), cmd.OutOrStdout(), bridge.ID, res, accountLoginOptions{
				cookies:        cookies,
				fields:         fields,
				nonInteractive: nonInteractive,
			})
			if err != nil {
				return err
			}
		}
		if opts.JSON {
			return printData(opts, res)
		}
		return printAccountLoginStep(cmd.OutOrStdout(), res)
	case "accounts:remove":
		accountID, err := resolveAccountID(ctx, client, firstArgOrFlag(cmd, args, "account"))
		if err != nil {
			return err
		}
		if accountID == "" {
			return usageError("missing account selector")
		}
		return usageError("Desktop API account removal is not exposed by github.com/beeper/desktop-api-go/v5; refusing to guess an endpoint for account %q", accountID)
	default:
		return usageError("%s is registered but no typed account handler is available", spec.Name)
	}
}

type accountLoginOptions struct {
	cookies        map[string]string
	fields         map[string]string
	nonInteractive bool
}

func runGuidedAccountLogin(ctx context.Context, client beeperdesktopapi.Client, in io.Reader, out io.Writer, bridgeID string, session *beeperdesktopapi.LoginSession, opts accountLoginOptions) (*beeperdesktopapi.LoginSession, error) {
	reader := bufio.NewReader(in)
	for {
		if err := printAccountLoginStep(out, session); err != nil {
			return nil, err
		}
		switch string(session.Status) {
		case "complete", "cancelled", "failed":
			return session, nil
		}
		step := session.CurrentStep
		if step.StepID == "" || step.Type == "" {
			return nil, usageError("Account login session did not include a current step.")
		}
		switch step.Type {
		case "display_and_wait":
			if opts.nonInteractive {
				return session, nil
			}
			fmt.Fprintln(out, "waiting for this step to complete...")
			next, err := client.Bridges.LoginSessions.Steps.Submit(ctx, step.StepID, beeperdesktopapi.BridgeLoginSessionStepSubmitParams{
				BridgeID:       bridgeID,
				LoginSessionID: session.LoginSessionID,
				Type:           beeperdesktopapi.BridgeLoginSessionStepSubmitParamsTypeDisplayAndWait,
			})
			if err != nil {
				return nil, err
			}
			session = next
		case "user_input":
			userInput := step.AsUserInput()
			fields := map[string]string{}
			for _, field := range userInput.Fields {
				if value, ok := opts.fields[field.ID]; ok {
					fields[field.ID] = value
					continue
				}
				if opts.nonInteractive {
					if field.InitialValue != "" {
						fields[field.ID] = field.InitialValue
						continue
					}
					return nil, usageError("Missing required field %s. Pass --field %s=... or run without --non-interactive.", field.ID, field.ID)
				}
				fallback := ""
				if field.InitialValue != "" {
					fallback = " [" + field.InitialValue + "]"
				}
				label := firstNonEmpty(field.Label, field.ID)
				value, err := promptLine(reader, out, label+fallback+": ")
				if err != nil {
					return nil, err
				}
				if value == "" {
					value = field.InitialValue
				}
				fields[field.ID] = value
			}
			next, err := client.Bridges.LoginSessions.Steps.Submit(ctx, userInput.StepID, beeperdesktopapi.BridgeLoginSessionStepSubmitParams{
				BridgeID:       bridgeID,
				LoginSessionID: session.LoginSessionID,
				Type:           beeperdesktopapi.BridgeLoginSessionStepSubmitParamsTypeUserInput,
				Fields:         fields,
			})
			if err != nil {
				return nil, err
			}
			session = next
		case "cookies":
			cookieStep := step.AsCookies()
			fields := map[string]string{}
			for _, field := range cookieStep.Fields {
				if value, ok := opts.cookies[field.ID]; ok {
					fields[field.ID] = value
					continue
				}
				if opts.nonInteractive {
					return nil, usageError("Missing required cookie %s. Pass --cookie %s=... or run without --non-interactive.", field.ID, field.ID)
				}
				value, err := promptLine(reader, out, field.ID+": ")
				if err != nil {
					return nil, err
				}
				fields[field.ID] = value
			}
			next, err := client.Bridges.LoginSessions.Steps.Submit(ctx, cookieStep.StepID, beeperdesktopapi.BridgeLoginSessionStepSubmitParams{
				BridgeID:       bridgeID,
				LoginSessionID: session.LoginSessionID,
				Type:           beeperdesktopapi.BridgeLoginSessionStepSubmitParamsTypeCookies,
				Fields:         fields,
				Source:         beeperdesktopapi.BridgeLoginSessionStepSubmitParamsSourceAPI,
			})
			if err != nil {
				return nil, err
			}
			session = next
		case "complete":
			return session, nil
		default:
			return nil, usageError("Unsupported account login step: %s", step.Type)
		}
	}
}

func printAccountLoginStep(out io.Writer, session *beeperdesktopapi.LoginSession) error {
	if session == nil {
		return nil
	}
	fmt.Fprintf(out, "status: %s\n", session.Status)
	if session.LoginID != "" {
		fmt.Fprintf(out, "login_id: %s\n", session.LoginID)
	}
	step := session.CurrentStep
	if step.Type == "" {
		return nil
	}
	fmt.Fprintf(out, "step: %s\n", step.Type)
	if step.Instructions != "" {
		fmt.Fprintln(out, step.Instructions)
	}
	if step.StepID != "" {
		fmt.Fprintf(out, "step_id: %s\n", step.StepID)
	}
	switch step.Type {
	case "display_and_wait":
		display := step.AsDisplayAndWait().Display
		fmt.Fprintf(out, "display: %s\n", display.Type)
		if display.Data != "" {
			fmt.Fprintln(out, display.Data)
		}
		if display.ImageURL != "" {
			fmt.Fprintf(out, "image: %s\n", display.ImageURL)
		}
	case "user_input":
		for _, field := range step.AsUserInput().Fields {
			details := strings.Join(nonEmptyStrings(field.Type, field.Placeholder), " | ")
			suffix := ""
			if details != "" {
				suffix = " (" + details + ")"
			}
			fmt.Fprintf(out, "field %s: %s%s\n", field.ID, firstNonEmpty(field.Label, field.ID), suffix)
		}
	case "cookies":
		cookies := step.AsCookies()
		fmt.Fprintf(out, "url: %s\n", cookies.URL)
		if cookies.UserAgent != "" {
			fmt.Fprintf(out, "user_agent: %s\n", cookies.UserAgent)
		}
		if cookies.ExpectedFinalURLRegex != "" {
			fmt.Fprintf(out, "expected_final_url_regex: %s\n", cookies.ExpectedFinalURLRegex)
		}
		for _, field := range cookies.Fields {
			fieldType := string(field.Type)
			if fieldType == "" {
				fieldType = "cookie"
			}
			fmt.Fprintf(out, "cookie field %s: %s\n", field.ID, fieldType)
		}
		if cookies.ExtractJs != "" {
			fmt.Fprintf(out, "extract_js:\n%s\n", cookies.ExtractJs)
		}
	case "complete":
		complete := step.AsComplete()
		id := firstNonEmpty(complete.Login.LoginID, session.LoginID, "yes")
		fmt.Fprintf(out, "complete: %s\n", id)
	}
	return nil
}

func chooseBridge(in io.Reader, out io.Writer, items []beeperdesktopapi.Bridge) (string, error) {
	available := []beeperdesktopapi.Bridge{}
	for _, item := range items {
		if item.Status == beeperdesktopapi.BridgeStatusAvailable {
			available = append(available, item)
		}
	}
	if len(available) == 0 {
		return "", usageError("No available bridges to connect.")
	}
	fmt.Fprintln(out, "Choose a bridge to connect an account:")
	for i, bridge := range available {
		multiple := "single account"
		if bridge.SupportsMultipleAccounts {
			multiple = "multiple allowed"
		}
		fmt.Fprintf(out, "  %d. %s (%s) - %s\n", i+1, bridge.DisplayName, bridge.ID, multiple)
	}
	reader := bufio.NewReader(in)
	for {
		answer, err := promptLine(reader, out, "Select a bridge: ")
		if err != nil {
			return "", err
		}
		if idx, ok := parseOneBasedIndex(answer, len(available)); ok {
			return available[idx].ID, nil
		}
		for _, bridge := range available {
			if bridge.ID == answer {
				return bridge.ID, nil
			}
		}
		fmt.Fprintln(out, "Choose one of the listed bridges.")
	}
}

func chooseLoginFlow(in io.Reader, out io.Writer, flows []beeperdesktopapi.LoginFlow) (string, error) {
	fmt.Fprintln(out, "Choose how you want to sign in:")
	for i, flow := range flows {
		description := ""
		if flow.Description != "" {
			description = " - " + flow.Description
		}
		fmt.Fprintf(out, "  %d. %s%s\n", i+1, firstNonEmpty(flow.Name, flow.ID), description)
	}
	reader := bufio.NewReader(in)
	for {
		answer, err := promptLine(reader, out, "Select a sign-in method: ")
		if err != nil {
			return "", err
		}
		if idx, ok := parseOneBasedIndex(answer, len(flows)); ok {
			return flows[idx].ID, nil
		}
		for _, flow := range flows {
			if flow.ID == answer {
				return flow.ID, nil
			}
		}
		fmt.Fprintln(out, "Choose one of the listed sign-in methods.")
	}
}

func printAvailableBridges(out io.Writer, items []beeperdesktopapi.Bridge) {
	sections := []struct {
		title    string
		provider beeperdesktopapi.BridgeProvider
	}{
		{"On-Device Accounts", beeperdesktopapi.BridgeProviderLocal},
		{"Beeper Cloud Accounts", beeperdesktopapi.BridgeProviderCloud},
		{"Self-Hosted Accounts", beeperdesktopapi.BridgeProviderSelfHosted},
	}
	fmt.Fprintln(out, "Choose a bridge to connect an account:")
	fmt.Fprintln(out)
	for _, section := range sections {
		hasAny := false
		for _, bridge := range items {
			if bridge.Provider == section.provider {
				if !hasAny {
					fmt.Fprintln(out, section.title)
					hasAny = true
				}
				status := bridge.StatusText
				if status == "" {
					status = bridgeStatusLabel(bridge)
				}
				multiple := "single account"
				if bridge.SupportsMultipleAccounts {
					multiple = "multiple allowed"
				}
				suffix := ""
				if status != "" {
					suffix = " - " + status
				}
				fmt.Fprintf(out, "  %s (%s) - %s%s\n", bridge.DisplayName, bridge.ID, multiple, suffix)
				if bridge.Status == beeperdesktopapi.BridgeStatusAvailable {
					fmt.Fprintf(out, "    beeper accounts add %s\n", bridge.ID)
				}
			}
		}
		if hasAny {
			fmt.Fprintln(out)
		}
	}
	fmt.Fprintln(out, "Run `beeper bridges list` for the scriptable catalog or `beeper bridges show <bridge>` for login flows.")
}

func resolveBridge(items []beeperdesktopapi.Bridge, input string) (beeperdesktopapi.Bridge, error) {
	normalizedInput := normalizeSelector(input)
	exact := []beeperdesktopapi.Bridge{}
	for _, item := range items {
		for _, value := range []string{item.ID, item.DisplayName, item.Network, item.Type} {
			if normalizeSelector(value) == normalizedInput {
				exact = append(exact, item)
				break
			}
		}
	}
	if len(exact) == 1 {
		return exact[0], nil
	}
	if len(exact) > 1 {
		return beeperdesktopapi.Bridge{}, ambiguousBridge(input, exact)
	}
	partial := []beeperdesktopapi.Bridge{}
	for _, item := range items {
		for _, value := range []string{item.ID, item.DisplayName, item.Network, item.Type} {
			if strings.Contains(normalizeSelector(value), normalizedInput) {
				partial = append(partial, item)
				break
			}
		}
	}
	if len(partial) == 1 {
		return partial[0], nil
	}
	if len(partial) > 1 {
		return beeperdesktopapi.Bridge{}, ambiguousBridge(input, partial)
	}
	return beeperdesktopapi.Bridge{}, usageError("Unknown bridge %q. Run `beeper bridges list` to list available bridges.", input)
}

func ambiguousBridge(input string, matches []beeperdesktopapi.Bridge) error {
	options := []string{}
	for _, item := range matches {
		options = append(options, fmt.Sprintf("%s (%s)", item.DisplayName, item.ID))
	}
	return usageError("Account type %s is ambiguous. Use one of: %s", input, strings.Join(options, ", "))
}

func parseKeyValueFlags(values []string, flagName string) (map[string]string, error) {
	parsed := map[string]string{}
	for _, value := range values {
		index := strings.Index(value, "=")
		if index <= 0 {
			return nil, usageError("%s must use name=value form.", flagName)
		}
		parsed[value[:index]] = value[index+1:]
	}
	return parsed, nil
}

func promptLine(reader *bufio.Reader, out io.Writer, label string) (string, error) {
	fmt.Fprint(out, label)
	value, err := reader.ReadString('\n')
	if err != nil && err != io.EOF {
		return "", err
	}
	return strings.TrimSpace(value), nil
}

func parseOneBasedIndex(value string, max int) (int, bool) {
	if value == "" {
		return 0, false
	}
	n := 0
	for _, r := range value {
		if r < '0' || r > '9' {
			return 0, false
		}
		n = n*10 + int(r-'0')
	}
	if n < 1 || n > max {
		return 0, false
	}
	return n - 1, true
}

func bridgeStatusLabel(bridge beeperdesktopapi.Bridge) string {
	if bridge.Status == beeperdesktopapi.BridgeStatusAvailable {
		return ""
	}
	if bridge.Status == beeperdesktopapi.BridgeStatusConnected {
		return bridge.DisplayName + " Connected"
	}
	return strings.ReplaceAll(string(bridge.Status), "_", " ")
}

func nonEmptyStrings(values ...string) []string {
	out := []string{}
	for _, value := range values {
		if value != "" {
			out = append(out, value)
		}
	}
	return out
}

func stdinIsTTY() bool {
	stat, err := os.Stdin.Stat()
	return err == nil && stat.Mode()&os.ModeCharDevice != 0
}

func runContactCommand(opts *globalOptions, spec commandSpec, cmd *cobra.Command, args []string) error {
	client, ctx, cancel, err := newClient(opts)
	if err != nil {
		return err
	}
	defer cancel()
	accountSelectors, _ := cmd.Flags().GetStringArray("account")
	accountIDs, err := contactAccountIDs(ctx, client, accountSelectors)
	if err != nil {
		return err
	}
	limit, _ := cmd.Flags().GetInt("limit")
	if limit == 0 {
		limit = 20
	}
	query := firstArgOrFlag(cmd, args, "query")
	switch spec.Name {
	case "contacts", "contacts:list":
		rows := []shared.User{}
		for _, accountID := range accountIDs {
			pager := client.Accounts.Contacts.ListAutoPaging(ctx, accountID, beeperdesktopapi.AccountContactListParams{
				Query: param.NewOpt(query),
				Limit: param.NewOpt(int64(limit)),
			})
			for pager.Next() {
				rows = append(rows, pager.Current())
				if len(rows) >= limit {
					break
				}
			}
			if err := pager.Err(); err != nil {
				return err
			}
			if len(rows) >= limit {
				break
			}
		}
		if ids, _ := cmd.Flags().GetBool("ids"); ids {
			values := make([]string, 0, len(rows))
			for _, row := range rows {
				values = append(values, row.ID)
			}
			return printData(opts, values)
		}
		return printData(opts, rows)
	case "contacts:search":
		if query == "" {
			return usageError("missing search query")
		}
		rows := []shared.User{}
		for _, accountID := range accountIDs {
			res, err := client.Accounts.Contacts.Search(ctx, accountID, beeperdesktopapi.AccountContactSearchParams{
				Query: query,
			})
			if err != nil {
				return err
			}
			rows = append(rows, res.Items...)
		}
		return printData(opts, rows)
	case "contacts:show":
		if query == "" && len(args) > 1 {
			query = args[1]
		}
		if query == "" {
			return usageError("missing contact query")
		}
		for _, accountID := range accountIDs {
			res, err := client.Accounts.Contacts.Search(ctx, accountID, beeperdesktopapi.AccountContactSearchParams{
				Query: query,
			})
			if err != nil {
				return err
			}
			if len(res.Items) > 0 {
				return printData(opts, res.Items[0])
			}
		}
		return usageError("contact not found: %s", query)
	default:
		return usageError("%s is registered but no typed contact handler is available", spec.Name)
	}
}

func contactAccountIDs(ctx context.Context, client beeperdesktopapi.Client, selectors []string) ([]string, error) {
	if len(selectors) > 0 {
		return resolveAccountIDs(ctx, client, selectors, true)
	}
	accounts, err := client.Accounts.List(ctx)
	if err != nil {
		return nil, err
	}
	ids := make([]string, 0, len(*accounts))
	for _, account := range *accounts {
		if account.AccountID != "" {
			ids = append(ids, account.AccountID)
		}
	}
	if len(ids) == 0 {
		return nil, usageError("no connected accounts")
	}
	return ids, nil
}

func firstArgOrFlag(cmd *cobra.Command, args []string, name string) string {
	if flag := cmd.Flags().Lookup(name); flag != nil && flag.Value.String() != "" {
		return flag.Value.String()
	}
	if len(args) > 0 {
		return args[0]
	}
	return ""
}

func resolveAccountID(ctx context.Context, client beeperdesktopapi.Client, input string) (string, error) {
	if input == "" {
		cfg, err := readConfig()
		if err != nil {
			return "", err
		}
		input = cfg.DefaultAccount
	}
	if input == "" {
		return "", nil
	}
	accounts, err := client.Accounts.List(ctx)
	if err != nil {
		return "", err
	}
	normalizedInput := normalizeSelector(input)
	matches := []beeperdesktopapi.Account{}
	for _, account := range *accounts {
		values := []string{
			account.AccountID,
			account.Network,
			account.Bridge.Type,
			account.Bridge.ID,
			account.User.ID,
			account.User.Username,
			account.User.FullName,
			account.User.Email,
		}
		for _, value := range values {
			if normalizeSelector(value) == normalizedInput {
				matches = append(matches, account)
				break
			}
		}
	}
	if len(matches) == 0 {
		for _, account := range *accounts {
			values := []string{account.AccountID, account.Network, account.Bridge.Type, account.Bridge.ID, account.User.FullName, account.User.Username}
			for _, value := range values {
				if strings.Contains(normalizeSelector(value), normalizedInput) {
					matches = append(matches, account)
					break
				}
			}
		}
	}
	if len(matches) == 0 {
		return "", usageError("no account matches %q", input)
	}
	if len(matches) > 1 {
		choices := []string{}
		for i, account := range matches {
			choices = append(choices, fmt.Sprintf("  %d. %s %s %s", i+1, account.AccountID, account.Network, account.User.FullName))
		}
		return "", usageError("ambiguous account %q. Use an exact account ID:\n%s", input, strings.Join(choices, "\n"))
	}
	return matches[0].AccountID, nil
}

func resolveAccountIDs(ctx context.Context, client beeperdesktopapi.Client, inputs []string, allowMultiplePerInput bool) ([]string, error) {
	if len(inputs) == 0 {
		return nil, nil
	}
	accounts, err := client.Accounts.List(ctx)
	if err != nil {
		return nil, err
	}
	resolved := []string{}
	seen := map[string]bool{}
	for _, input := range inputs {
		matches := matchAccounts(*accounts, input)
		if len(matches) == 0 {
			return nil, usageError("no account matches %q", input)
		}
		if len(matches) > 1 && !allowMultiplePerInput {
			return nil, ambiguousAccountError(input, matches)
		}
		for _, account := range matches {
			if account.AccountID != "" && !seen[account.AccountID] {
				resolved = append(resolved, account.AccountID)
				seen[account.AccountID] = true
			}
		}
	}
	return resolved, nil
}

func matchAccounts(accounts []beeperdesktopapi.Account, input string) []beeperdesktopapi.Account {
	normalizedInput := normalizeSelector(input)
	exact := []beeperdesktopapi.Account{}
	for _, account := range accounts {
		values := []string{
			account.AccountID,
			account.Network,
			account.Bridge.Type,
			account.Bridge.ID,
			account.User.ID,
			account.User.Username,
			account.User.FullName,
			account.User.Email,
		}
		for _, value := range values {
			if normalizeSelector(value) == normalizedInput {
				exact = append(exact, account)
				break
			}
		}
	}
	if len(exact) > 0 {
		return exact
	}
	partial := []beeperdesktopapi.Account{}
	for _, account := range accounts {
		values := []string{account.AccountID, account.Network, account.Bridge.Type, account.Bridge.ID, account.User.FullName, account.User.Username}
		for _, value := range values {
			if strings.Contains(normalizeSelector(value), normalizedInput) {
				partial = append(partial, account)
				break
			}
		}
	}
	return partial
}

func ambiguousAccountError(input string, matches []beeperdesktopapi.Account) error {
	choices := []string{}
	for i, account := range matches {
		choices = append(choices, fmt.Sprintf("  %d. %s %s %s", i+1, account.AccountID, account.Network, account.User.FullName))
	}
	return usageError("ambiguous account %q. Use an exact account ID:\n%s", input, strings.Join(choices, "\n"))
}
