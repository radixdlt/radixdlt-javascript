type RadixLogLevel =
	| 'emerg'
	| 'alert'
	| 'crit'
	| 'error'
	| 'warning'
	| 'notice'
	| 'info'
	| 'debug'
	| 'verbose'
	| 'dev'

const log = {
	verbose: (input: any) => {},
	dev: (input: any) => {},
	silent: (input: any) => {},
	debug: (input: any) => {},
	error: (input: any) => {},
	warn: (input: any) => {},
	help: (input: any) => {},
	data: (input: any) => {},
	info: (input: any) => {},
	alert: (input: any) => {},
	warning: (input: any) => {},
}

const restoreDefaultLogLevel = () => {}

const setLogLevel = (input: any) => {}

export { RadixLogLevel, log, restoreDefaultLogLevel, setLogLevel }
