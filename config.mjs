import moment from 'moment'
import { promisify } from 'util'
import { existsSync, readFile } from 'fs'

export const staticPath = 'static'
export const uploadDir = `./${staticPath}/uploads`
export const sslPath = `./${staticPath}/ssl`
export const appsPath = ['apps/gui']
export const allowedMime = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif']

export const envPort = key => {
	const ports = (function _(http, https) {
		return {
			http,
			https
		}
	})(...JSON.parse(process.env.PORTS || '[]'))

	return ports[key] || null
}

export const error404 = async () => {
	const file = `${staticPath}/404.html`

	if (!existsSync(file)) return null

	return promisify(readFile)(file, 'utf8')
}

export const readSSL = async (sslDir = null, sslKey = null) => {
	const file = ''.concat(
		sslDir || process.env.SSL_PATH || sslPath,
		'/',
		sslKey || process.env.SSL_KEY || 'default',
		'.'
	)

	for (const i of ['key', 'cert']) {
		if (!existsSync(file.concat(i)))
			throw new Error(`File "${file.concat(i)}" not found`)
	}

	const key = await promisify(readFile)(file.concat('key'), 'utf8')
	const cert = await promisify(readFile)(file.concat('cert'), 'utf8')

	return { key, cert }
}

export const db = {
	connect: [
		'grapher', // db name
		'postgres', // db user
		'', // password
		{
			host: 'localhost',
			port: 5432,
			dialect: 'postgres',
			timezone: moment().format('Z'),
			logging: false,
			pool: {
				max: 5,
				min: 0,
				acquire: 30000,
				idle: 10000
			}
		}
	]
}

export const rdb = {
	connect: {
		host: 'localhost',
		port: 28015,
		db: 'grapher'
	}
}

export const locales = {
	default: 'en',
	active: ['en', 'ua'],
	headerKey: 'applang',
	directory: `./${staticPath}/locales/`
}

export const jwt = {
	tokens: {
		access: {
			secret: 'secret',
			exp: '24h' // default: 24h
		},
		refresh: {
			secret: 'secret',
			exp: '7d' // default: 7d
		}
	},
	headerKey: 'authorization', // header request key, default: authorization
	deadTokenHeaderStatus: 203, // default: 203
	instance: {
		apptype: ['ide', 'dev', 'admin', 'user'],
		appplatform: ['web', 'android', 'ios'],
		applang: locales.active
	}
}

export const api = {
	endpoint: '/api',
	downloadSchema: {
		json: '/schema.json',
		graphql: '/schema.graphql',
		path: `./${staticPath}/schema`
	},
	loger: {
		env: process.env.NODE_ENV,
		staticPath: `./${staticPath}`,
		path: `./${staticPath}/log`,
		errors: {
			file: `./${staticPath}/log/errors.log`,
			ignore: {
				apptype: ['ide'],
				appplatform: [],
				query: [],
				mutation: [],
				types: [
					'GRAPHQL_VALIDATION_FAILED',
					'USERS_LOGIN',
					'USERS_PERMISSION_DENIED'
				]
			}
		},
		queries: {
			file:
				process.env.NODE_ENV && process.env.NODE_ENV === 'development'
					? `./${staticPath}/log/queries.log`
					: null,
			ignore: {
				apptype: ['ide'],
				appplatform: [],
				query: ['serverLog', 'ping', 'serverInfo'],
				mutation: []
			},
			logResults: false
		},
		userPermissions: `./${staticPath}/storage/user-permissions.json`
	},
	playgroundIDE: {
		version: '1.7.8'
	}
}

export const mailer = {
	systemMail: 'example@gmail.com',
	default: {
		from: {
			name: 'robot'
		},
		subject: 'no-reply-subject'
	},
	template: {
		dir: `./${staticPath}/mail-templates`,
		wrapper: 'default.html',
		defTmpl: 'message.html',
		logo: `/logo.png`,
		aliases: ['disable_user', 'enable_user', 'forgot_password']
	},
	smtp: {
		host: 'smtp.gmail.com',
		port: 587,
		secure: false,
		auth: {
			user: 'example@gmail.com',
			pass: 'pass'
		}
	}
}

export const gmap = {
	// ApiKey: '<Api key>',
	reverseGeocode: {
		types: {
			country: ['country'],
			city: ['locality'],
			/* area: [
				'administrative_area_level_1',
				'administrative_area_level_2',
				'administrative_area_level_3'
			], */
			street: ['route'],
			building: ['street_number']
		}
	}
}

export const pushServer = Object.assign(
	{
		events: ['onTest', 'onUserEnable', 'onUserDisable'],
		eventsPack: {
			user: ['onTest', 'onUserEnable', 'onUserDisable'],
			admin: ['onTest', 'onUserEnable', 'onUserDisable']
		},
		appsOnPlatfroms: {
			web: ['user', 'admin'],
			android: ['user', 'admin'],
			ios: ['user', 'admin']
		}
	},
	jwt.instance
)

export default {
	envPort,
	staticPath,
	appsPath,
	uploadDir,
	allowedMime,
	sslPath,
	readSSL,
	rdb,
	jwt,
	api,
	mailer,
	locales,
	pushServer
}
