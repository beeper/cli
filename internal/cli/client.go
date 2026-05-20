package cli

import (
	"context"
	"os"
	"time"

	beeperdesktopapi "github.com/beeper/desktop-api-go/v5"
	"github.com/beeper/desktop-api-go/v5/option"
)

func newClient(opts *globalOptions) (beeperdesktopapi.Client, context.Context, context.CancelFunc, error) {
	return newClientWithStoredAuth(opts, true)
}

func newClientWithStoredAuth(opts *globalOptions, useStoredAuth bool) (beeperdesktopapi.Client, context.Context, context.CancelFunc, error) {
	requestOptions := []option.RequestOption{}
	target, err := resolveTarget(opts)
	if err != nil {
		return beeperdesktopapi.Client{}, nil, nil, err
	}
	if target.BaseURL != "" {
		requestOptions = append(requestOptions, option.WithBaseURL(target.BaseURL))
	}
	if !useStoredAuth {
		requestOptions = append(requestOptions, option.WithAccessToken(""))
	} else if os.Getenv("BEEPER_ACCESS_TOKEN") == "" && target.Auth != nil && target.Auth.AccessToken != "" {
		requestOptions = append(requestOptions, option.WithAccessToken(target.Auth.AccessToken))
	}
	if opts.Timeout != "" {
		d, err := time.ParseDuration(opts.Timeout)
		if err != nil {
			return beeperdesktopapi.Client{}, nil, nil, usageError("invalid --timeout %q: %v", opts.Timeout, err)
		}
		requestOptions = append(requestOptions, option.WithRequestTimeout(d))
		ctx, cancel := context.WithTimeout(context.Background(), d)
		return beeperdesktopapi.NewClient(requestOptions...), ctx, cancel, nil
	}
	return beeperdesktopapi.NewClient(requestOptions...), context.Background(), func() {}, nil
}
