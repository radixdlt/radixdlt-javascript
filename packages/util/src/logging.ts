import log from 'loglevel'
import chalk from 'chalk'
import prefix from 'loglevel-plugin-prefix'

export enum LogLevel {
	SILENT = 'silent',
	TRACE = 'trace',
	DEBUG = 'debug',
	INFO = 'info',
	WARN = 'warn',
	ERROR = 'error',
}

log.setLevel(LogLevel.WARN)

const meta = {
	trace: {
		color: chalk.italic.cyan,
		emoji: '💜',
	},
	debug: {
		color: chalk.italic.cyan,
		emoji: '💚',
	},
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
		emoji: '❤️',
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
