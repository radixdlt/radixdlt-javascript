import log from 'loglevel'
import chalk from 'chalk'
import prefix from 'loglevel-plugin-prefix'

export enum LogLevel {
	DEBUG = 'debug',
	ERROR = 'error',
	WARN = 'warn',
	INFO = 'info',
	SILENT = 'silent',
}

log.setLevel('warn')

const meta = {
	info: {
		color: chalk.blue,
		emoji: '💙',
	},
	warn: {
		color: chalk.yellow,
		emoji: '💛',
	},
	error: {
		color: chalk.red,
		emoji: '❤',
	},
	debug: {
		color: chalk.italic.cyan,
		emoji: '💻',
	},
}

prefix.reg(log)

prefix.apply(log, {
	format: (level, name, timestamp) =>
		`${chalk.gray(`[${timestamp.toString()}]`)} ${
			meta[level.toLowerCase() as Exclude<LogLevel, 'silent'>].emoji
		} ${meta[level.toLowerCase() as Exclude<LogLevel, 'silent'>].color(
			level,
		)}`,
})

export { log }
