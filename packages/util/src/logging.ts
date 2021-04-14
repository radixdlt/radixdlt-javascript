// import log from 'loglevel'
import chalk, { Chalk } from 'chalk'
// import prefix from 'loglevel-plugin-prefix'
import winston from 'winston'
import {
	AbstractConfigSetColors,
	SyslogConfigSetColors,
	SyslogConfigSetLevels,
} from 'winston/lib/winston/config'
import * as Config from 'winston/lib/winston/config'

// export enum LogLevel {
// 	SILENT = 'silent',
// 	TRACE = 'trace',
// 	DEBUG = 'debug',
// 	INFO = 'info',
// 	WARN = 'warn',
// 	ERROR = 'error',
// }
//
// const defaultLogLevel = LogLevel.WARN
//
// const restoreDefaultLogLevel = (): void => {
// 	log.setLevel(defaultLogLevel)
// }

// restoreDefaultLogLevel()

type RadixExtraLogLevels = Readonly<{
	verbose: unknown
	dev: unknown
}>

// Inspired by RFC 5424: https://tools.ietf.org/html/rfc5424#section-6.2.1
// eslint-disable-next-line functional/prefer-type-literal
type RadixLogLevels = RadixExtraLogLevels &
	SyslogConfigSetLevels &
	Readonly<{
		// // system is unusable
		// emergency: 0,
		//
		// // action must be taken immediately
		// alert: 1,
		//
		// // critical conditions
		// critical: 2,
		//
		// // error conditions
		// error: 3,
		//
		// // warning conditions
		// warn: 4,
		//
		// // normal but significant condition
		// notice: 5,
		//
		// // informational messages
		// info: 6,
		//
		// // debug-level messages
		// debug: 7,

		// useful for following a flow of events
		verbose: number //8,

		// used by developer during development
		dev: number //9,
	}>

type LogLevelOrnament = Readonly<{
	color: chalk.Chalk
	emoji: string
}>

type LevelKey = keyof RadixLogLevels

type MetaMapish = {
	[key in LevelKey]: LogLevelOrnament
}
const meta: MetaMapish = {
	emergency: {
		color: chalk.bold.redBright,
		emoji: '☣️',
	},

	alert: {
		color: chalk.bold.red,
		emoji: '🚨',
	},

	critical: {
		color: chalk.bold.red,
		emoji: '⛔️',
	},

	error: {
		color: chalk.red,
		emoji: '❤️',
	},

	warning: {
		color: chalk.yellow,
		emoji: '💛',
	},

	notice: {
		color: chalk.magenta,
		emoji: '💟',
	},

	info: {
		color: chalk.blue,
		emoji: '💙',
	},

	debug: {
		color: chalk.cyan,
		emoji: '💚',
	},

	verbose: {
		color: chalk.italic.white,
		emoji: '🤍',
	},

	dev: {
		color: chalk.italic.cyanBright,
		emoji: '🔮',
	},
}

const radixLogLevels: RadixLogLevels = {
	...winston.config.syslog.levels,
	verbose: 8,
	dev: 9,
}

type RadixLogLevelColors = RadixExtraLogLevels &
	SyslogConfigSetColors &
	Readonly<{
		verbose: string | string[]
		dev: string | string[]
	}>

const radixLogLevelColors: RadixLogLevelColors = {
	...winston.config.syslog.colors,
	verbose: 'apa',
	dev: 'banan',
}

// syslog: { levels: SyslogConfigSetLevels, colors: SyslogConfigSetColors };

const makeRadixLogger = (): winston.Logger => {
	const logger = winston.createLogger({
		level: 'info',
		levels: radixLogLevels,
		// levels: winston.config.syslog.levels,
		format: winston.format.json(),
		defaultMeta: { service: 'user-service' },
		transports: [
			//
			// - Write all logs with level `error` and below to `error.log`
			// - Write all logs with level `info` and below to `combined.log`
			//
			new winston.transports.Console(),
			new winston.transports.File({ filename: 'error.log', level: 'error' }),
			new winston.transports.File({ filename: 'combined.log' }),
		],
		exitOnError: false,
	})
	winston.addColors(radixLogLevelColors)
	return logger
}

const log = makeRadixLogger()

prefix.reg(log)

prefix.apply(log, {
	format: (level, name, timestamp) =>
		`${chalk.gray(`[${timestamp.toString()}]`)} ${
			meta[level.toLowerCase()].emoji
		} ${meta[level.toLowerCase()].color(level)}`,
})

export { log, restoreDefaultLogLevel }
