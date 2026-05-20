package ui

import (
	"encoding/json"
	"fmt"
	"reflect"
	"sort"
	"strings"

	"github.com/charmbracelet/lipgloss"
	"github.com/charmbracelet/lipgloss/table"
)

var (
	headerStyle = lipgloss.NewStyle().Bold(true).Foreground(lipgloss.Color("39"))
	cellStyle   = lipgloss.NewStyle().Padding(0, 1)
	borderStyle = lipgloss.NewStyle().Foreground(lipgloss.Color("240"))
)

func RenderHuman(value any) string {
	if value == nil {
		return ""
	}
	rows := rowsFromValue(value)
	if len(rows) == 0 {
		data, _ := json.MarshalIndent(value, "", "  ")
		return string(data)
	}
	columns := columnsForRows(rows)
	t := table.New().
		Border(lipgloss.NormalBorder()).
		BorderStyle(borderStyle).
		StyleFunc(func(row, col int) lipgloss.Style {
			if row == table.HeaderRow {
				return headerStyle.Padding(0, 1)
			}
			return cellStyle
		}).
		Headers(columns...)
	for _, row := range rows {
		values := make([]string, 0, len(columns))
		for _, col := range columns {
			values = append(values, scalar(row[col]))
		}
		t.Row(values...)
	}
	return t.String()
}

func rowsFromValue(value any) []map[string]any {
	rv := reflect.ValueOf(value)
	for rv.Kind() == reflect.Pointer {
		if rv.IsNil() {
			return nil
		}
		rv = rv.Elem()
	}
	if rv.Kind() == reflect.Slice || rv.Kind() == reflect.Array {
		rows := []map[string]any{}
		for i := 0; i < rv.Len(); i++ {
			if row := rowFromValue(rv.Index(i).Interface()); len(row) > 0 {
				rows = append(rows, row)
			}
		}
		return rows
	}
	if row := rowFromValue(value); len(row) > 0 {
		return []map[string]any{row}
	}
	return nil
}

func rowFromValue(value any) map[string]any {
	data, err := json.Marshal(value)
	if err != nil {
		return nil
	}
	var row map[string]any
	if err := json.Unmarshal(data, &row); err != nil {
		return nil
	}
	delete(row, "JSON")
	return row
}

func columnsForRows(rows []map[string]any) []string {
	seen := map[string]bool{}
	columns := []string{}
	preferred := []string{"id", "localChatID", "title", "type", "accountID", "unreadCount", "status", "url", "localURL", "pendingMessageID"}
	for _, key := range preferred {
		for _, row := range rows {
			if _, ok := row[key]; ok && !seen[key] {
				seen[key] = true
				columns = append(columns, key)
			}
		}
	}
	extra := []string{}
	for _, row := range rows {
		for key := range row {
			if !seen[key] {
				seen[key] = true
				extra = append(extra, key)
			}
		}
	}
	sort.Strings(extra)
	columns = append(columns, extra...)
	if len(columns) > 6 {
		columns = columns[:6]
	}
	return columns
}

func scalar(value any) string {
	switch v := value.(type) {
	case nil:
		return ""
	case string:
		return v
	case float64, bool:
		return fmt.Sprint(v)
	default:
		data, _ := json.Marshal(v)
		return strings.TrimSpace(string(data))
	}
}
