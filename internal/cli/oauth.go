package cli

import (
	"context"
	"crypto/rand"
	"crypto/sha256"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"net"
	"net/http"
	"net/url"
	"os/exec"
	"runtime"
	"strings"
	"time"
)

type oauthToken struct {
	AccessToken string `json:"access_token"`
	ExpiresIn   int64  `json:"expires_in,omitempty"`
	Scope       string `json:"scope,omitempty"`
	TokenType   string `json:"token_type"`
	ClientID    string `json:"-"`
}

func loginWithPKCE(ctx context.Context, baseURL string, openBrowser bool, timeout time.Duration) (*oauthToken, error) {
	if timeout == 0 {
		timeout = 2 * time.Minute
	}
	callback, err := newOAuthCallback(timeout)
	if err != nil {
		return nil, err
	}
	defer callback.close()

	redirectURI := fmt.Sprintf("http://127.0.0.1:%d/callback", callback.port)
	registered, err := registerOAuthClient(ctx, baseURL, redirectURI)
	if err != nil {
		return nil, err
	}
	verifier := randomURLSafe(32)
	challengeBytes := sha256.Sum256([]byte(verifier))
	challenge := base64.RawURLEncoding.EncodeToString(challengeBytes[:])
	state := randomURLSafe(24)

	authURL, err := url.Parse(resolveURL(baseURL, firstNonEmpty(registered.AuthorizationEndpoint, "/oauth/authorize")))
	if err != nil {
		return nil, err
	}
	query := authURL.Query()
	query.Set("client_id", registered.ClientID)
	query.Set("redirect_uri", redirectURI)
	query.Set("response_type", "code")
	query.Set("scope", "read write")
	query.Set("state", state)
	query.Set("code_challenge", challenge)
	query.Set("code_challenge_method", "S256")
	authURL.RawQuery = query.Encode()
	if openBrowser {
		if err := openExternal(authURL.String()); err != nil {
			fmt.Printf("Open this URL to authenticate:\n%s\n", authURL.String())
		}
	} else {
		fmt.Printf("Open this URL to authenticate:\n%s\n", authURL.String())
	}

	result, err := callback.wait(ctx)
	if err != nil {
		return nil, err
	}
	if result.State != state {
		return nil, usageError("OAuth state mismatch")
	}
	if result.Error != "" {
		return nil, usageError("OAuth authorization failed: %s", result.Error)
	}
	if result.Code == "" {
		return nil, usageError("OAuth callback did not include an authorization code")
	}
	token, err := exchangeOAuthToken(ctx, firstNonEmpty(registered.TokenEndpoint, resolveURL(baseURL, "/oauth/token")), registered.ClientID, result.Code, verifier, redirectURI)
	if err != nil {
		return nil, err
	}
	token.ClientID = registered.ClientID
	return token, nil
}

type oauthRegistration struct {
	AuthorizationEndpoint string `json:"authorization_endpoint"`
	ClientID              string `json:"client_id"`
	TokenEndpoint         string `json:"token_endpoint"`
}

func registerOAuthClient(ctx context.Context, baseURL, redirectURI string) (*oauthRegistration, error) {
	body := strings.NewReader(`{"client_name":"Beeper CLI","grant_types":["authorization_code"],"response_types":["code"],"redirect_uris":["` + redirectURI + `"],"scope":"read write","token_endpoint_auth_method":"none"}`)
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, resolveURL(baseURL, "/oauth/register"), body)
	if err != nil {
		return nil, err
	}
	req.Header.Set("content-type", "application/json")
	res, err := http.DefaultClient.Do(req)
	if err != nil {
		return nil, err
	}
	defer res.Body.Close()
	if res.StatusCode < 200 || res.StatusCode >= 300 {
		return nil, usageError("OAuth client registration failed: %s", res.Status)
	}
	var out oauthRegistration
	if err := json.NewDecoder(res.Body).Decode(&out); err != nil {
		return nil, err
	}
	if out.ClientID == "" {
		return nil, usageError("OAuth client registration did not return client_id")
	}
	return &out, nil
}

func exchangeOAuthToken(ctx context.Context, endpoint, clientID, code, verifier, redirectURI string) (*oauthToken, error) {
	form := url.Values{}
	form.Set("grant_type", "authorization_code")
	form.Set("client_id", clientID)
	form.Set("code", code)
	form.Set("code_verifier", verifier)
	form.Set("redirect_uri", redirectURI)
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, endpoint, strings.NewReader(form.Encode()))
	if err != nil {
		return nil, err
	}
	req.Header.Set("content-type", "application/x-www-form-urlencoded")
	res, err := http.DefaultClient.Do(req)
	if err != nil {
		return nil, err
	}
	defer res.Body.Close()
	if res.StatusCode < 200 || res.StatusCode >= 300 {
		return nil, usageError("OAuth token exchange failed: %s", res.Status)
	}
	var token oauthToken
	if err := json.NewDecoder(res.Body).Decode(&token); err != nil {
		return nil, err
	}
	if token.AccessToken == "" {
		return nil, usageError("OAuth token exchange did not return access_token")
	}
	if token.TokenType == "" {
		token.TokenType = "Bearer"
	}
	return &token, nil
}

type oauthCallback struct {
	server *http.Server
	port   int
	ch     chan oauthCallbackResult
}

type oauthCallbackResult struct {
	Code  string
	Error string
	State string
}

func newOAuthCallback(timeout time.Duration) (*oauthCallback, error) {
	listener, err := net.Listen("tcp", "127.0.0.1:0")
	if err != nil {
		return nil, err
	}
	cb := &oauthCallback{port: listener.Addr().(*net.TCPAddr).Port, ch: make(chan oauthCallbackResult, 1)}
	mux := http.NewServeMux()
	mux.HandleFunc("/callback", func(w http.ResponseWriter, r *http.Request) {
		q := r.URL.Query()
		w.Header().Set("content-type", "text/html")
		fmt.Fprint(w, "<!doctype html><title>Beeper CLI</title><p>You can close this tab and return to the terminal.</p>")
		cb.ch <- oauthCallbackResult{Code: q.Get("code"), Error: q.Get("error"), State: q.Get("state")}
	})
	cb.server = &http.Server{Handler: mux, ReadHeaderTimeout: timeout}
	go func() {
		_ = cb.server.Serve(listener)
	}()
	return cb, nil
}

func (c *oauthCallback) wait(ctx context.Context) (oauthCallbackResult, error) {
	select {
	case result := <-c.ch:
		return result, nil
	case <-ctx.Done():
		return oauthCallbackResult{}, ctx.Err()
	}
}

func (c *oauthCallback) close() {
	ctx, cancel := context.WithTimeout(context.Background(), time.Second)
	defer cancel()
	_ = c.server.Shutdown(ctx)
}

func randomURLSafe(n int) string {
	buf := make([]byte, n)
	if _, err := rand.Read(buf); err != nil {
		panic(err)
	}
	return base64.RawURLEncoding.EncodeToString(buf)
}

func resolveURL(baseURL, path string) string {
	parsed, err := url.Parse(path)
	if err == nil && parsed.IsAbs() {
		return parsed.String()
	}
	base, _ := url.Parse(baseURL)
	return base.ResolveReference(&url.URL{Path: path}).String()
}

func openExternal(rawURL string) error {
	switch runtime.GOOS {
	case "darwin":
		return exec.Command("open", rawURL).Start()
	case "windows":
		return exec.Command("cmd", "/c", "start", "", rawURL).Start()
	default:
		return exec.Command("xdg-open", rawURL).Start()
	}
}
