SHELL := /bin/bash

node-command := xargs -n 1 -I file node file

.PHONY : test

test:
		@find test -name "*-tests.js" | $(node-command)
