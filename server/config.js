import moment from 'moment'

global.envPort = key => {
	const ports = (function _(http, https, ws) {
		return {
			http,
			https,
			ws
		}
	})(...JSON.parse(process.env.PORTS || '[]'))

	return ports[key] || null
}

export const server = {
	port: global.envPort('http'),
	staticPath: 'static',
	uploadDir: './static/uploads',
	allowedMime: ['image/png', 'image/jpeg', 'image/jpg', 'image/gif'],
	ssl: {
		port: global.envPort('https'),
		key: './ssl/localhost.key',
		cert: './ssl/localhost.cert'
	}
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
			operatorsAliases: false,
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

export const jwt = {
	tokens: {
		access: {
			secret: 'secret',
			exp: '24h' // def 24h
		},
		refresh: {
			secret: 'secret',
			exp: '7d'
		}
	},
	headerKey: 'authorization', // header request key
	deadTokenHeaderStatus: 203
}

export const api = {
	// subscriptions server
	ws: {
		port: global.envPort('ws'),
		url: '/subscriptions'
	},
	endpointURL: '/api',
	graphiqlURL: '/graphiql',
	schemaJSON: './static/schema.json',
	schemaFile: false, // './static/schema.graphql'.
	loger: {
		errors: {
			enabled: true,
			file: './log/errors.log'
		},
		queries: {
			enabled: true,
			file: './log/queries.log'
		}
	},
	// options https://github.com/apollographql/graphql-tools/blob/master/docs/source/generate-schema.md
	executableOptions: {}
}

export const mailer = {
	template: {
		dir: './mail-templates',
		wrapper: 'default.html',
		defTmpl: 'message.html',
		logo: '/logo-mail.png'
	},
	smtp: {
		host: 'smtp.gmail.com',
		port: 587,
		secure: false,
		auth: {
			user: '<user@gmail.com>',
			pass: '<gmail password>'
		}
	}
}

export const locales = {
	headerKey: 'applang',
	default: 'en',
	active: ['en', 'ar']
}

export const pushServer = {
	// Firebase config
	databaseURL: false,
	authKey: false,
	platforms: ['admin', 'android', 'ios'],
	events: ['onTest', 'onUserDisable', 'onUserEnable']
}

export const gmap = {
	ApiKey: false,
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

export default {
	server,
	rdb,
	jwt,
	api,
	mailer,
	locales,
	pushServer
}
