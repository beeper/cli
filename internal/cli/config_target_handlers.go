package cli

import (
	"os"
	"path/filepath"
	"sort"
	"strings"

	"github.com/spf13/cobra"
)

func runConfigCommand(opts *globalOptions, spec commandSpec, cmd *cobra.Command, args []string) error {
	switch spec.Name {
	case "config:path":
		return printData(opts, configPath())
	case "config:get":
		cfg, err := readConfig()
		if err != nil {
			return err
		}
		if cfg.Auth != nil {
			redacted := *cfg.Auth
			redacted.AccessToken = "[redacted]"
			cfg.Auth = &redacted
		}
		key := flagOrPos(cmd, args, "key", 0)
		switch key {
		case "":
			return printData(opts, cfg)
		case "baseURL":
			return printData(opts, cfg.BaseURL)
		case "auth":
			return printData(opts, cfg.Auth)
		case "defaultTarget":
			return printData(opts, cfg.DefaultTarget)
		case "defaultAccount":
			return printData(opts, cfg.DefaultAccount)
		default:
			return usageError("unknown config key %q", key)
		}
	case "config:set":
		key := flagOrPos(cmd, args, "key", 0)
		value := flagOrPos(cmd, args, "value", 1)
		cfg, err := readConfig()
		if err != nil {
			return err
		}
		switch key {
		case "defaultTarget":
			cfg.DefaultTarget = value
		case "defaultAccount":
			cfg.DefaultAccount = value
		default:
			return usageError("config set supports defaultTarget or defaultAccount")
		}
		if err := writeConfig(cfg); err != nil {
			return err
		}
		return printData(opts, map[string]any{key: value})
	case "config:reset":
		if err := os.Remove(configPath()); err != nil && !os.IsNotExist(err) {
			return err
		}
		return printData(opts, map[string]any{"reset": true})
	default:
		return usageError("unhandled config command %s", spec.Name)
	}
}

func runTargetCommand(opts *globalOptions, spec commandSpec, cmd *cobra.Command, args []string) error {
	switch spec.Name {
	case "targets", "targets:list":
		cfg, err := readConfig()
		if err != nil {
			return err
		}
		targets, err := listTargets()
		if err != nil {
			return err
		}
		if len(targets) == 0 {
			targets = []target{*builtInTarget(cfg)}
		}
		rows := []map[string]any{}
		for _, target := range targets {
			rows = append(rows, map[string]any{
				"default": cfg.DefaultTarget == target.ID || (cfg.DefaultTarget == "" && target.ID == builtInDesktopTarget),
				"id":      target.ID,
				"type":    target.Type,
				"name":    target.Name,
				"managed": target.Managed,
				"baseURL": target.BaseURL,
				"runtime": target.Runtime,
				"status":  liveTargetStatus(target),
			})
		}
		return printData(opts, rows)
	case "targets:show":
		selected := flagOrPos(cmd, args, "name", 0)
		localOpts := *opts
		if selected != "" {
			localOpts.Target = selected
			localOpts.BaseURL = ""
		}
		target, err := resolveTarget(&localOpts)
		if err != nil {
			return err
		}
		return printData(opts, target)
	case "targets:add:remote":
		name := flagOrPos(cmd, args, "name", 0)
		baseURL := flagOrPos(cmd, args, "url", 1)
		if name == "" || baseURL == "" {
			return usageError("targets add remote requires name and url")
		}
		existing, err := readTarget(name)
		if err != nil {
			return err
		}
		if existing != nil {
			return usageError("target %q already exists", name)
		}
		target := target{ID: name, Name: name, Type: "remote", BaseURL: baseURL}
		if err := writeTarget(target); err != nil {
			return err
		}
		makeDefault, _ := cmd.Flags().GetBool("default")
		if makeDefault {
			cfg, err := readConfig()
			if err != nil {
				return err
			}
			cfg.DefaultTarget = target.ID
			if err := writeConfig(cfg); err != nil {
				return err
			}
		}
		return printData(opts, target)
	case "targets:add:desktop", "targets:add:server":
		kind := "desktop"
		defaultID := "desktop"
		if spec.Name == "targets:add:server" {
			kind = "server"
			defaultID = "server"
		}
		name := flagOrPos(cmd, args, "name", 0)
		if name == "" {
			name = defaultID
		}
		existing, err := readTarget(name)
		if err != nil {
			return err
		}
		if existing != nil {
			return usageError("target %q already exists", name)
		}
		port, _ := cmd.Flags().GetInt("port")
		serverEnv := firstFlag(cmd, "server-env")
		target, err := createProfileTarget(kind, name, port, serverEnv)
		if err != nil {
			return err
		}
		makeDefault, _ := cmd.Flags().GetBool("default")
		if makeDefault {
			cfg, err := readConfig()
			if err != nil {
				return err
			}
			cfg.DefaultTarget = target.ID
			if err := writeConfig(cfg); err != nil {
				return err
			}
		}
		return printData(opts, target)
	case "targets:remove":
		name := flagOrPos(cmd, args, "name", 0)
		if name == "" {
			return usageError("missing target name")
		}
		if err := removeTarget(name); err != nil {
			return err
		}
		return printData(opts, map[string]any{"id": name, "removed": true})
	case "targets:use":
		name := flagOrPos(cmd, args, "name", 0)
		if name == "" {
			return usageError("missing target name")
		}
		if name != builtInDesktopTarget {
			target, err := readTarget(name)
			if err != nil {
				return err
			}
			if target == nil {
				return usageError("unknown Beeper target %q. Run `beeper targets list`.", name)
			}
		}
		cfg, err := readConfig()
		if err != nil {
			return err
		}
		cfg.DefaultTarget = name
		if err := writeConfig(cfg); err != nil {
			return err
		}
		return printData(opts, map[string]any{"defaultTarget": name})
	case "targets:status":
		selected := flagOrPos(cmd, args, "name", 0)
		localOpts := *opts
		if selected != "" {
			localOpts.Target = selected
			localOpts.BaseURL = ""
		}
		target, err := resolveTarget(&localOpts)
		if err != nil {
			return err
		}
		status := liveTargetStatus(*target)
		if !status.Reachable {
			cmd.Root().SilenceErrors = true
		}
		return printData(opts, map[string]any{"target": target, "status": status})
	case "targets:start", "targets:stop", "targets:restart", "targets:enable", "targets:disable":
		name := flagOrPos(cmd, args, "name", 0)
		if name == "" {
			name = opts.Target
		}
		localOpts := *opts
		if name != "" {
			localOpts.Target = name
			localOpts.BaseURL = ""
		}
		target, err := resolveTarget(&localOpts)
		if err != nil {
			return err
		}
		switch spec.Name {
		case "targets:start":
			run, err := startProfile(*target)
			if err != nil {
				return err
			}
			return printData(opts, run)
		case "targets:stop":
			if err := stopProfile(*target); err != nil {
				return err
			}
			return printData(opts, map[string]any{"id": target.ID, "stopped": true})
		case "targets:restart":
			_ = stopProfile(*target)
			run, err := startProfile(*target)
			if err != nil {
				return err
			}
			return printData(opts, run)
		case "targets:enable":
			path, err := enableProfile(*target)
			if err != nil {
				return err
			}
			return printData(opts, map[string]any{"id": target.ID, "enabled": true, "path": path, "target": target})
		case "targets:disable":
			path, err := disableProfile(*target)
			if err != nil {
				return err
			}
			return printData(opts, map[string]any{"id": target.ID, "enabled": false, "path": path, "target": target})
		}
	case "targets:logs":
		name := flagOrPos(cmd, args, "name", 0)
		localOpts := *opts
		if name != "" {
			localOpts.Target = name
			localOpts.BaseURL = ""
		}
		target, err := resolveTarget(&localOpts)
		if err != nil {
			return err
		}
		lines, _ := cmd.Flags().GetInt("lines")
		if lines == 0 {
			lines = 200
		}
		fileLimit, _ := cmd.Flags().GetInt("files")
		allFiles, _ := cmd.Flags().GetBool("all")
		files := []string{profileLogPath(target.ID), profileErrorLogPath(target.ID)}
		if target.Type == "desktop" && target.DataDir != "" {
			desktopLogs := discoverLogFiles(filepath.Join(target.DataDir, "logs"))
			if !allFiles {
				if fileLimit <= 0 {
					fileLimit = 5
				}
				if len(desktopLogs) > fileLimit {
					desktopLogs = desktopLogs[:fileLimit]
				}
			}
			files = append(files, desktopLogs...)
		}
		seen := map[string]bool{}
		type logOutput struct {
			Path    string `json:"path"`
			Content string `json:"content"`
		}
		outputs := []logOutput{}
		for _, path := range files {
			if seen[path] {
				continue
			}
			seen[path] = true
			content, err := os.ReadFile(path)
			if err != nil || len(content) == 0 {
				continue
			}
			tailed := tailLines(string(content), lines)
			if opts.JSON {
				outputs = append(outputs, logOutput{Path: path, Content: tailed})
				continue
			}
			cmd.OutOrStdout().Write([]byte("\n==> " + path + " <==\n"))
			cmd.OutOrStdout().Write([]byte(tailed))
		}
		if opts.JSON {
			return printData(opts, outputs)
		}
		return nil
	default:
		return usageError("%s is registered but no local target implementation is available yet", spec.Name)
	}
	return nil
}

func discoverLogFiles(dir string) []string {
	type logFile struct {
		path    string
		modTime int64
	}
	files := []logFile{}
	_ = filepath.WalkDir(dir, func(path string, d os.DirEntry, err error) error {
		if err != nil || d.IsDir() || !strings.HasSuffix(d.Name(), ".log") {
			return nil
		}
		info, err := d.Info()
		if err != nil {
			return nil
		}
		files = append(files, logFile{path: path, modTime: info.ModTime().UnixNano()})
		return nil
	})
	sort.Slice(files, func(i, j int) bool {
		if files[i].modTime == files[j].modTime {
			return files[i].path > files[j].path
		}
		return files[i].modTime > files[j].modTime
	})
	paths := make([]string, 0, len(files))
	for _, file := range files {
		paths = append(paths, file.path)
	}
	return paths
}

func tailLines(content string, lines int) string {
	if lines <= 0 {
		return content
	}
	parts := strings.Split(content, "\n")
	start := len(parts) - lines - 1
	if start < 0 {
		start = 0
	}
	out := strings.Join(parts[start:], "\n")
	if !strings.HasSuffix(out, "\n") {
		out += "\n"
	}
	return out
}
