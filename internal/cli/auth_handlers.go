package cli

import (
	"bufio"
	"context"
	"net/http"
	"net/url"
	"os"
	"strings"
	"time"

	beeperdesktopapi "github.com/beeper/desktop-api-go/v5"
	"github.com/beeper/desktop-api-go/v5/option"
	"github.com/spf13/cobra"
)

func runAuthCommand(opts *globalOptions, spec commandSpec, cmd *cobra.Command, args []string) error {
	switch spec.Name {
	case "auth:status":
		target, err := resolveTarget(opts)
		if err != nil {
			return err
		}
		return printData(opts, authStatusForTarget(*target))
	case "auth:email:start":
		email := firstFlag(cmd, "email")
		if email == "" {
			return usageError("missing --email")
		}
		target, err := resolveTarget(opts)
		if err != nil {
			return err
		}
		client, ctx := setupLoginClient(*target)
		start, err := client.App.Login.Start(ctx)
		if err != nil {
			return err
		}
		if err := client.App.Login.Email(ctx, beeperdesktopapi.AppLoginEmailParams{SetupRequestID: start.SetupRequestID, Email: email}); err != nil {
			return err
		}
		return printData(opts, map[string]any{"setupRequestID": start.SetupRequestID})
	case "auth:email:response":
		target, err := resolveTarget(opts)
		if err != nil {
			return err
		}
		setupRequestID := firstFlag(cmd, "setup-request-id", "setupRequestID")
		code := firstFlag(cmd, "code", "response")
		if setupRequestID == "" || code == "" {
			return usageError("auth email response requires --setup-request-id and --code")
		}
		client, ctx := setupLoginClient(*target)
		res, err := client.App.Login.Response(ctx, beeperdesktopapi.AppLoginResponseParams{SetupRequestID: setupRequestID, Response: code})
		if err != nil {
			return err
		}
		token := res.Matrix.AccessToken
		if token == "" && res.RegistrationRequired {
			yes, _ := cmd.Flags().GetBool("yes")
			if (opts.JSON || !stdinIsTTY()) && !yes {
				return usageError("Registration requires --yes to accept the Beeper terms in non-interactive setup.")
			}
			username := firstFlag(cmd, "username")
			if username == "" && stdinIsTTY() && !opts.JSON {
				username = firstString(res.UsernameSuggestions)
				value, err := promptLine(bufio.NewReader(os.Stdin), os.Stdout, "Username ["+username+"]: ")
				if err != nil {
					return err
				}
				if value != "" {
					username = value
				}
			}
			if username == "" {
				return usageError("Registration requires --username.")
			}
			registered, err := client.App.Login.Register(ctx, beeperdesktopapi.AppLoginRegisterParams{
				AcceptTerms:    true,
				LeadToken:      res.LeadToken,
				SetupRequestID: res.SetupRequestID,
				Username:       username,
			})
			if err != nil {
				return err
			}
			token = registered.Matrix.AccessToken
		}
		if token == "" {
			return usageError("Setup did not return an access token.")
		}
		auth := &storedAuth{AccessToken: token, Source: "manual", TokenType: "Bearer"}
		if err := saveTargetAuth(*target, auth); err != nil {
			return err
		}
		target.Auth = auth
		return printData(opts, setupResult(*target, "manual"))
	case "auth:logout":
		_, ctx, cancel, err := newClient(opts)
		if err != nil {
			return err
		}
		defer cancel()
		target, err := resolveTarget(opts)
		if err != nil {
			return err
		}
		if os.Getenv("BEEPER_ACCESS_TOKEN") != "" && (target.Auth == nil || target.Auth.AccessToken == "") {
			return usageError("auth logout cannot clear BEEPER_ACCESS_TOKEN from the environment; unset it in the calling process")
		}
		hadToken := target.Auth != nil && target.Auth.AccessToken != ""
		revoked := false
		if hadToken {
			form := url.Values{}
			form.Set("token", target.Auth.AccessToken)
			form.Set("token_type_hint", "access_token")
			req, err := http.NewRequestWithContext(ctx, http.MethodPost, strings.TrimRight(target.BaseURL, "/")+"/oauth/revoke", strings.NewReader(form.Encode()))
			if err == nil {
				req.Header.Set("content-type", "application/x-www-form-urlencoded")
				httpClient := &http.Client{Timeout: 5 * time.Second}
				if res, err := httpClient.Do(req); err == nil {
					revoked = res.StatusCode >= 200 && res.StatusCode < 300
					res.Body.Close()
				}
			}
			cfg, err := readConfig()
			if err != nil {
				return err
			}
			if target.ID == customTargetID || target.ID == builtInDesktopTarget {
				cfg.Auth = nil
				if err := writeConfig(cfg); err != nil {
					return err
				}
			} else {
				target.Auth = nil
				if err := writeTarget(*target); err != nil {
					return err
				}
			}
		}
		return printData(opts, map[string]any{"revoked": revoked, "hadToken": hadToken})
	default:
		return usageError("%s is registered but no typed auth SDK method is available", spec.Name)
	}
}

func authStatusForTarget(target target) map[string]any {
	authenticated := os.Getenv("BEEPER_ACCESS_TOKEN") != "" || (target.Auth != nil && target.Auth.AccessToken != "")
	source := "none"
	if os.Getenv("BEEPER_ACCESS_TOKEN") != "" {
		source = "env"
	} else if target.Auth != nil && target.Auth.Source != "" {
		source = target.Auth.Source
	} else if target.Auth != nil && target.Auth.AccessToken != "" {
		source = "target"
	}
	out := map[string]any{
		"authenticated": authenticated,
		"target":        target.ID,
		"baseURL":       target.BaseURL,
		"source":        source,
	}
	if target.Auth != nil {
		out["clientID"] = target.Auth.ClientID
		out["expiresAt"] = target.Auth.ExpiresAt
		out["scope"] = target.Auth.Scope
	}
	return out
}

func setupLoginClient(target target) (beeperdesktopapi.Client, context.Context) {
	return beeperdesktopapi.NewClient(
		option.WithBaseURL(target.BaseURL),
		option.WithAccessToken("setup-login-public-client"),
	), context.Background()
}
