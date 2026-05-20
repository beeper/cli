package cli

import (
	"bufio"
	"context"
	"fmt"
	"os"
	"strings"

	beeperdesktopapi "github.com/beeper/desktop-api-go/v5"
	"github.com/beeper/desktop-api-go/v5/packages/param"
	"github.com/spf13/cobra"
)

func runVerifyCommand(opts *globalOptions, spec commandSpec, cmd *cobra.Command, args []string) error {
	if spec.Name == "verify:status" {
		return printData(opts, evaluateReadiness(opts))
	}
	client, ctx, cancel, err := newClient(opts)
	if err != nil {
		return err
	}
	defer cancel()
	id := firstArgOrFlag(cmd, args, "id")
	if id == "" {
		id = "active"
	}
	switch spec.Name {
	case "verify":
		res, err := driveVerification(opts, client, ctx, firstFlag(cmd, "user"))
		if err != nil {
			return err
		}
		return printData(opts, res)
	case "verify:list":
		res, err := client.App.Verifications.List(ctx)
		if err != nil {
			return err
		}
		return printData(opts, res)
	case "verify:show":
		res, err := client.App.Verifications.Get(ctx, id)
		if err != nil {
			return err
		}
		return printData(opts, res)
	case "verify:start":
		params := beeperdesktopapi.AppVerificationNewParams{}
		if user := firstFlag(cmd, "user"); user != "" {
			params.UserID = param.NewOpt(user)
		}
		res, err := client.App.Verifications.New(ctx, params)
		if err != nil {
			return err
		}
		return printData(opts, res)
	case "verify:approve":
		res, err := client.App.Verifications.Accept(ctx, id)
		if err != nil {
			return err
		}
		return printData(opts, res)
	case "verify:cancel":
		res, err := client.App.Verifications.Cancel(ctx, id, beeperdesktopapi.AppVerificationCancelParams{})
		if err != nil {
			return err
		}
		return printData(opts, res)
	case "verify:sas":
		res, err := client.App.Verifications.SAS.Start(ctx, id)
		if err != nil {
			return err
		}
		return printData(opts, res)
	case "verify:sas-confirm":
		res, err := client.App.Verifications.SAS.Confirm(ctx, id)
		if err != nil {
			return err
		}
		return printData(opts, res)
	case "verify:qr-scan":
		payload := firstFlag(cmd, "payload")
		if payload == "" {
			return usageError("missing --payload")
		}
		res, err := client.App.Verifications.Qr.Scan(ctx, beeperdesktopapi.AppVerificationQrScanParams{Data: payload})
		if err != nil {
			return err
		}
		return printData(opts, res)
	case "verify:qr-confirm":
		res, err := client.App.Verifications.Qr.ConfirmScanned(ctx, id)
		if err != nil {
			return err
		}
		return printData(opts, res)
	case "verify:recovery-key":
		key := firstFlag(cmd, "key")
		if key == "" {
			return usageError("missing --key")
		}
		res, err := client.App.Login.Verification.RecoveryKey.Verify(ctx, beeperdesktopapi.AppLoginVerificationRecoveryKeyVerifyParams{RecoveryKey: key})
		if err != nil {
			return err
		}
		return printData(opts, res)
	case "verify:reset-recovery-key":
		res, err := client.App.Login.Verification.RecoveryKey.Reset.New(ctx, beeperdesktopapi.AppLoginVerificationRecoveryKeyResetNewParams{})
		if err != nil {
			return err
		}
		return printData(opts, res)
	default:
		return usageError("%s is registered but no typed verification SDK method is available", spec.Name)
	}
}

func driveVerification(opts *globalOptions, client beeperdesktopapi.Client, ctx context.Context, userID string) (*beeperdesktopapi.AppSessionResponse, error) {
	for {
		session, err := client.App.Session(ctx)
		if err != nil {
			return nil, err
		}
		if session.State == beeperdesktopapi.AppSessionResponseStateReady {
			return session, nil
		}
		if session.State == beeperdesktopapi.AppSessionResponseStateNeedsLogin {
			return nil, usageError("Target is not signed in. Run `beeper setup` after signing in to Beeper Desktop.")
		}
		verification := session.Verification
		if verification.ID == "" {
			params := beeperdesktopapi.AppVerificationNewParams{}
			if userID != "" {
				params.UserID = param.NewOpt(userID)
			}
			if _, err := client.App.Verifications.New(ctx, params); err != nil {
				return nil, err
			}
			continue
		}
		actions := verification.AvailableActions
		switch {
		case containsAction(actions, "accept"):
			if _, err := client.App.Verifications.Accept(ctx, verification.ID); err != nil {
				return nil, err
			}
		case containsAction(actions, "sas.start"):
			if _, err := client.App.Verifications.SAS.Start(ctx, verification.ID); err != nil {
				return nil, err
			}
		case containsAction(actions, "sas.confirm"):
			if err := confirmSAS(opts, verification); err != nil {
				return nil, err
			}
			if _, err := client.App.Verifications.SAS.Confirm(ctx, verification.ID); err != nil {
				return nil, err
			}
		case containsAction(actions, "qr.confirmScanned"):
			if _, err := client.App.Verifications.Qr.ConfirmScanned(ctx, verification.ID); err != nil {
				return nil, err
			}
		default:
			return session, nil
		}
	}
}

func confirmSAS(opts *globalOptions, verification beeperdesktopapi.AppSessionResponseVerification) error {
	if opts.Yes {
		return nil
	}
	sas := firstNonEmpty(verification.SAS.Emojis, verification.SAS.Decimals, "(no SAS data)")
	if opts.JSON || !stdinIsTTY() {
		return usageError("SAS confirmation requires --yes in non-interactive mode. Compare this on the other device first: %s", sas)
	}
	fmt.Fprintln(os.Stdout, "Verify that this matches on the other device:")
	fmt.Fprintln(os.Stdout, sas)
	answer, err := promptLine(bufio.NewReader(os.Stdin), os.Stdout, "Do they match? [y/N]: ")
	if err != nil {
		return err
	}
	switch strings.ToLower(strings.TrimSpace(answer)) {
	case "y", "yes":
		return nil
	default:
		return usageError("Verification cancelled.")
	}
}

func containsAction(actions []string, want string) bool {
	for _, action := range actions {
		if action == want {
			return true
		}
	}
	return false
}
