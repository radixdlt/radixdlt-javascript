import winston, { LeveledLogMethod } from '@radixdlt/winston'
import * as Transport from 'winston-transport'
import {
	AbstractConfigSetColors,
	AbstractConfigSetLevels,
} from '@radixdlt/winston/lib/winston/config'
const { format, createLogger } = winston
const { combine, timestamp, colorize, simple, printf } = format

type FontStyle =
	| 'bold'
	| 'dim'
	| 'italic'
	| 'underline'
	| 'inverse'
	| 'hidden'
	| 'strikethrough'
type ForegroundColor =
	| 'black'
	| 'red'
	| 'green'
	| 'yellow'
	| 'blue'
	| 'magenta'
	| 'cyan'
	| 'white'
	| 'gray'
type BackgroundColor =
	| 'blackBG'
	| 'redBG'
	| 'greenBG'
	| 'yellowBG'
	| 'blueBG'
	| 'magentaBG'
	| 'cyanBG'
	| 'whiteBG'
	| 'grayBG'

type LogLevelInfo = Readonly<{
	foregroundColor: ForegroundColor
	fontStyle?: FontStyle
	backgroundColor?: BackgroundColor
	emoji: string
	priority: number
	purpose: string
}>

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

// Inspired by RFC 5424: https://tools.ietf.org/html/rfc5424#section-6.2.1
type LogLevelsInfo = { [key in RadixLogLevel]: LogLevelInfo }
const logLevelsInfo: LogLevelsInfo = {
	emerg: {
		foregroundColor: 'white',
		backgroundColor: 'redBG',
		fontStyle: 'bold',
		emoji: '☣️',
		priority: 0,
		purpose: 'For when system is unusable',
	},

	alert: {
		foregroundColor: 'red',
		backgroundColor: 'whiteBG',
		emoji: '🚨',
		priority: 1,
		purpose: 'For when action must be taken immediately',
	},

	crit: {
		foregroundColor: 'red',
		fontStyle: 'bold',
		emoji: '⛔️',
		priority: 2,
		purpose: 'For critical conditions',
	},

	error: {
		foregroundColor: 'red',
		emoji: '❤️',
		priority: 3,
		purpose: 'For error conditions',
	},

	warning: {
		foregroundColor: 'yellow',
		emoji: '💛',
		priority: 4,
		purpose: 'For warning conditions',
	},

	notice: {
		foregroundColor: 'magenta',
		emoji: '💟',
		priority: 5,
		purpose: 'For normal but significant condition',
	},

	info: {
		foregroundColor: 'blue',
		emoji: '💙',
		priority: 6,
		purpose: 'Informational messages',
	},

	debug: {
		foregroundColor: 'cyan',
		emoji: '💚',
		priority: 7,
		purpose: 'For debug-level messages',
	},

	verbose: {
		foregroundColor: 'white',
		fontStyle: 'italic',
		emoji: '🤍',
		priority: 8,
		purpose: 'For following a flow of events',
	},

	dev: {
		foregroundColor: 'cyan',
		fontStyle: 'italic',
		emoji: '🔮',
		priority: 9,
		purpose: 'Used by developer during development',
	},
}

type Dictionary<T> = {
	[key: string]: T
}

const objectMap = <TValue, TResult>(
	obj: Dictionary<TValue>,
	valSelector: (val: TValue, obj: Dictionary<TValue>) => TResult,
	keySelector?: (key: string, obj: Dictionary<TValue>) => string,
	ctx?: Dictionary<TValue>,
): Dictionary<TResult> => {
	const ret = {} as Dictionary<TResult>
	for (const key of Object.keys(obj)) {
		const retKey = keySelector
			? keySelector.call(ctx || null, key, obj)
			: key
		ret[retKey] = valSelector.call(ctx || null, obj[key], obj)
	}
	return ret
}

const extractValueOfInfo = <T>(
	extract: (info: LogLevelInfo) => T,
): { [key in RadixLogLevel]: T } => {
	// @ts-ignore
	return objectMap(
		logLevelsInfo,
		(val) => extract(val),
		(key) => key,
	)
}

type RadixLogLevels = AbstractConfigSetLevels & {
	verbose: number
	dev: number
}

type RadixLogger = winston.Logger &
	Readonly<{
		verbose: LeveledLogMethod
		dev: LeveledLogMethod
	}>

const extractLevels = (): RadixLogLevels =>
	extractValueOfInfo((i: LogLevelInfo): number => i.priority)

const extractColorsOfLevels = (): AbstractConfigSetColors =>
	extractValueOfInfo((i: LogLevelInfo): string => {
		return [i.fontStyle ?? '', i.foregroundColor, i.backgroundColor ?? '']
			.join(' ')
			.trim()
	})

const defaultLogLevel: RadixLogLevel = 'dev'

const setLogLevel = (newLevel: RadixLogLevel | 'silent'): RadixLogger => {
	const shouldSilent = newLevel === 'silent'
	log.configure({ level: newLevel, silent: shouldSilent })
	return log
}

const restoreDefaultLogLevel = (): RadixLogger => setLogLevel(defaultLogLevel)

const makeRadixLogger = (): RadixLogger => {
	const colorizedEmojiFormat = combine(
		timestamp(),
		simple(),
		printf((msg) => {
			const level: RadixLogLevel = msg.level as RadixLogLevel
			const logLevelInfo: LogLevelInfo = logLevelsInfo[level]!
			const msgWithEmoji = `${logLevelInfo.emoji}: ${msg.message}`
			return colorize().colorize(
				msg.level,
				// eslint-disable-next-line @typescript-eslint/restrict-template-expressions
				`${msg.timestamp} - ${msg.level}: ${msgWithEmoji}`,
			)
		}),
	)

	const transports: Transport[] = [
		//
		// - Write all logs with level `error` and below to `error.log`
		// - Write all logs with level `info` and below to `combined.log`
		//
		new winston.transports.File({
			format: colorizedEmojiFormat,
			filename: 'error.log',
			level: 'error',
		}),
		new winston.transports.File({
			format: colorizedEmojiFormat,
			filename: 'combined.log',
			level: 'info',
		}),
	]

	const maybeNodeEnv = process?.env?.NODE_ENV
	if (maybeNodeEnv === 'development' || maybeNodeEnv === 'test') {
		transports.push(
			new winston.transports.Console({
				format: colorizedEmojiFormat,
			}),
		)
	}

	//@ts-ignore
	const logger: RadixLogger = createLogger({
		level: defaultLogLevel,
		levels: extractLevels(),
		format: colorizedEmojiFormat,
		transports: transports,
		exitOnError: false,
	})

	winston.addColors(extractColorsOfLevels())
	winston.add(logger)
	return logger
}

const log = makeRadixLogger()

export { RadixLogLevel, log, restoreDefaultLogLevel, setLogLevel }
