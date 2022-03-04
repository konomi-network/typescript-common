import path from "path";
import winston, { format } from "winston";
import DailyRotateFile from "winston-daily-rotate-file";

const defaultLogFolder = "./data/konomi-cli";
const logFolder = path.join(process.env.LOG_FOLDER || defaultLogFolder, "log");
console.log("log folder", logFolder);

const infoLogFile = path.join(logFolder, "info-%DATE%.log");
const logFormat = format.combine(
    format.timestamp(),
    format.prettyPrint(),
    format.splat(),
    format.json(),
);
const logMeta = { service: 'konomi-cli' };

const logger = winston.createLogger({
    format: logFormat,
    defaultMeta: logMeta,
    transports: [
        new winston.transports.Console({ level: 'error' }),
        new DailyRotateFile({
            filename: infoLogFile,
            level: 'info',
        })
    ]
});

export default logger;
