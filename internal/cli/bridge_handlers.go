package cli

import "github.com/spf13/cobra"

func runBridgeCommand(opts *globalOptions, spec commandSpec, cmd *cobra.Command, args []string) error {
	client, ctx, cancel, err := newClient(opts)
	if err != nil {
		return err
	}
	defer cancel()
	switch spec.Name {
	case "bridges", "bridges:list":
		res, err := client.Bridges.List(ctx)
		if err != nil {
			return err
		}
		return printData(opts, res)
	case "bridges:show":
		bridgeID := firstArgOrFlag(cmd, args, "bridge")
		if bridgeID == "" {
			return usageError("missing bridge ID")
		}
		bridge, err := client.Bridges.Get(ctx, bridgeID)
		if err != nil {
			return err
		}
		flows, _ := client.Bridges.LoginFlows.List(ctx, bridgeID)
		capabilities, _ := client.Bridges.GetCapabilities(ctx, bridgeID)
		return printData(opts, map[string]any{"bridge": bridge, "loginFlows": flows, "capabilities": capabilities})
	default:
		return usageError("%s is registered but no typed bridge SDK method is available", spec.Name)
	}
}
