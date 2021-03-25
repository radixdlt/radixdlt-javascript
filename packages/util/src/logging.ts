import log from 'loglevel'
import chalk from 'chalk'
import prefix from 'loglevel-plugin-prefix'

export type LogLevel = 'error' | 'warn' | 'info' | 'silent'

const meta = {
    info: {
        color: chalk.blue,
        emoji: '💙'
    },
    warn: {
        color: chalk.yellow,
        emoji: '💛'
    },
    error: {
        color: chalk.red,
        emoji: '❤'
    }
}

prefix.reg(log)

prefix.apply(log, {
    format: (level, name, timestamp) => `${chalk.gray(`[${timestamp}]`)} ${meta[level.toLowerCase() as Exclude<LogLevel, 'silent'>].emoji} ${meta[level.toLowerCase() as Exclude<LogLevel, 'silent'>].color(level)}`
})

export { log }

