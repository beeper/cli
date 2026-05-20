package ui

import (
	"fmt"
	"io"

	"github.com/charmbracelet/bubbles/list"
	tea "github.com/charmbracelet/bubbletea"
)

type item string

func (i item) FilterValue() string { return string(i) }
func (i item) Title() string       { return string(i) }
func (i item) Description() string { return "" }

type pickerModel struct {
	list     list.Model
	selected string
}

func newPickerModel(title string, values []string) pickerModel {
	items := make([]list.Item, 0, len(values))
	for _, value := range values {
		items = append(items, item(value))
	}
	l := list.New(items, list.NewDefaultDelegate(), 80, 20)
	l.Title = title
	return pickerModel{list: l}
}

func (m pickerModel) Init() tea.Cmd { return nil }

func (m pickerModel) Update(msg tea.Msg) (tea.Model, tea.Cmd) {
	switch msg := msg.(type) {
	case tea.KeyMsg:
		switch msg.String() {
		case "enter":
			if selected, ok := m.list.SelectedItem().(item); ok {
				m.selected = string(selected)
			}
			return m, tea.Quit
		case "ctrl+c", "esc":
			return m, tea.Quit
		}
	case tea.WindowSizeMsg:
		m.list.SetSize(msg.Width, msg.Height)
	}
	var cmd tea.Cmd
	m.list, cmd = m.list.Update(msg)
	return m, cmd
}

func (m pickerModel) View() string {
	return m.list.View()
}

func Pick(title string, values []string, input io.Reader, output io.Writer) (string, error) {
	model := newPickerModel(title, values)
	program := tea.NewProgram(model, tea.WithInput(input), tea.WithOutput(output))
	result, err := program.Run()
	if err != nil {
		return "", err
	}
	picked, ok := result.(pickerModel)
	if !ok || picked.selected == "" {
		return "", fmt.Errorf("no selection")
	}
	return picked.selected, nil
}
