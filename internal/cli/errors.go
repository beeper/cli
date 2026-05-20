package cli

import (
	"errors"
	"fmt"
)

const (
	exitOK      = 0
	exitGeneric = 1
	exitUsage   = 2
)

type exitError struct {
	code int
	err  error
}

func (e exitError) Error() string {
	return e.err.Error()
}

func (e exitError) Unwrap() error {
	return e.err
}

func usageError(format string, args ...any) error {
	return exitError{code: exitUsage, err: fmt.Errorf(format, args...)}
}

func ExitCode(err error) int {
	if err == nil {
		return exitOK
	}
	var ee exitError
	if errors.As(err, &ee) {
		return ee.code
	}
	return exitGeneric
}
