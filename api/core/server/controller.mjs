import { promisify } from 'util'
import { existsSync, writeFile } from 'fs'
import http from 'http'
import https from 'https'
import { exec as cmd } from 'child_process'

import Controller from '../../../lib/proto/controller'
import pkg from '../../../package.json'
import {
	envPort,
	api,
	pushServer,
	jwt,
	readSSL,
	sslPath,
	locales
} from '../../../config'
import User from '../../user/controller'

export default class extends Controller {
	get table() {
		return 'server'
	}
	get user() {
		return new User().use(this.db, this.auth, this.locale)
	}
	async info({ dbInfo = false, sslInfo = false } = {}) {
		const { publicUrl: url } = global
		const { name, description, version } = pkg
		const {
			context: { ctx }
		} = this.api
		const { endpoint, downloadSchema, loger: apiLoger } = api
		const {
			tokens: { access: accessToken, refresh: refreshToken },
			headerKey,
			deadTokenHeaderStatus,
			instance
		} = jwt

		const [hostname, port] = ctx.get('host').split(':')

		const serverInfo = {
			name,
			version,
			description,
			url,
			hostname,
			port,
			dateTime: this.moment(),
			timeZone: this.moment().format('Z'),
			apiEndPoint: 'http://'.concat(hostname, ':', envPort('http'), endpoint),
			apiEndPointEncrypted: envPort('https')
				? 'https://'.concat(hostname, ':', envPort('https'), endpoint)
				: null,
			subscriptionsEndPoint: 'ws://'.concat(
				hostname,
				':',
				envPort('http'),
				endpoint
			),
			subscriptionsEndPointEncrypted: envPort('https')
				? 'wss://'.concat(hostname, ':', envPort('https'), endpoint)
				: null,
			schemaUrlJSON: downloadSchema.path.concat(downloadSchema.json),
			schemaUrlGraphql: downloadSchema.path.concat(downloadSchema.graphql),
			apiLoger,
			pushServer,
			JWT: {
				accessTokenExp: accessToken.exp,
				refreshTokenExp: refreshToken.exp,
				headerKey,
				deadTokenHeaderStatus,
				instance
			},
			ssl: readSSL(),
			locales,
			instance
		}

		if (dbInfo) {
			const query = await this.db.orm.query('SELECT VERSION();', {
				type: this.db.orm.QueryTypes.SELECT
			})

			if (query) {
				Object.assign(serverInfo, {
					dataBase: query.find(r => r).version
				})
			}
		}

		if (ctx.req.connection.encrypted && sslInfo) {
			const req = await this.request({ hostname, port }, 'https')

			const { valid_from, valid_to } = req.socket.getPeerCertificate()

			Object.assign(serverInfo, {
				sslValidFrom: this.moment(new Date(valid_from)),
				sslValidTo: this.moment(new Date(valid_to))
			})
		}

		return serverInfo
	}
	async request({ hostname = null, port = 80 } = {}, protocol = 'http') {
		return new Promise((resolve, reject) => {
			const connect = (protocol === 'http' ? http : https).get(
				{
					hostname,
					port,
					agent: false,
					rejectUnauthorized: false,
					ciphers: 'ALL'
				},
				res => resolve(res)
			)

			connect.on('error', error => {
				reject(error)
			})

			connect.end()
		})
	}
	async shutdown() {
		const shutdown = server =>
			new Promise((resolve, reject) => {
				try {
					server.close(() => resolve(true))
				} catch (error) {
					reject(error)
				}
			})

		const { http: httpServer, https: httpsServer } = this.api._servers || {}

		console.log(`Start shutdown servers`)

		if (httpsServer && (await shutdown(httpsServer)))
			console.log(`https server is shutdown`)

		if (httpServer && (await shutdown(httpServer)))
			console.log(`http server is shutdown`)

		return true
	}
	async restart(pm = true) {
		if (pm) {
			cmd('yarn pm:start')

			return true
		}

		await this.shutdown()
		await this.api.server.start()

		return true
	}
	async stop(pm = true) {
		if (pm) {
			cmd('yarn pm:stop')

			return true
		}

		await this.shutdown()

		return true
	}
	async log(type = 'errors', input = {}) {
		if (!this.loger.config[type] || !this.loger.config[type].file)
			throw this.error('log_not_found_or_disabled')

		let rows = await this.loger.read(this.loger.config[type].file, false)

		const {
			apptype = [],
			appplatform = [],
			errorType = [],
			date = [],
			params
		} = input

		if (apptype.length)
			rows = rows.filter(
				row => row.apptype && apptype.find(r => r === row.apptype)
			)

		if (appplatform.length)
			rows = rows.filter(
				row => row.appplatform && appplatform.find(r => r === row.appplatform)
			)

		if (errorType.length) {
			if (type !== 'errors') throw this.error('only_for_type_errors')

			rows = rows.filter(row => row.type && errorType.find(r => r === row.type))
		}

		if (date.length) rows = rows.filter(row => date.find(r => r === row.date))

		const { order: { column, sort } = {}, limit = 10, offset = 0 } =
			params || {}

		if (column) rows = rows.sort((a, b) => (a[column] > b[column] ? -1 : 1))
		if (sort && sort.toUpperCase() === 'ASC') rows.reverse()
		if (sort && sort.toUpperCase() === 'DESC') rows.sort()

		const count = rows.length || null

		return { count, rows: rows.slice(offset, offset + limit) }
	}
	async editSSL({ key, cert } = {}) {
		const file = sslPath.concat('/', process.env.SSL_PATH || 'default')

		if (existsSync(`${file}.key`) && key)
			await promisify(writeFile)(`${file}.key`, key)

		if (existsSync(`${file}.cert`) && key)
			await promisify(writeFile)(`${file}.cert`, cert)
	}
}
