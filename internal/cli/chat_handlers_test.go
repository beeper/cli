package cli

import (
	"testing"

	"github.com/spf13/cobra"
)

func TestChatStateFilterExcludeAliases(t *testing.T) {
	cmd := &cobra.Command{}
	addChatFlags(cmd, commandSpec{Name: "chats:list"})
	if err := cmd.Flags().Set("no-archived", "true"); err != nil {
		t.Fatal(err)
	}
	if matchesChatStateFilters(cmd, chatState{IsArchived: true}) {
		t.Fatal("expected --no-archived to exclude archived chats")
	}
	if !matchesChatStateFilters(cmd, chatState{IsArchived: false}) {
		t.Fatal("expected --no-archived to keep non-archived chats")
	}
}

func TestChatStateFilterPositiveAliases(t *testing.T) {
	cmd := &cobra.Command{}
	addChatFlags(cmd, commandSpec{Name: "chats:list"})
	if err := cmd.Flags().Set("unread", "true"); err != nil {
		t.Fatal(err)
	}
	if !matchesChatStateFilters(cmd, chatState{UnreadCount: 1}) {
		t.Fatal("expected --unread to keep unread chats")
	}
	if matchesChatStateFilters(cmd, chatState{}) {
		t.Fatal("expected --unread to exclude read chats")
	}
}
