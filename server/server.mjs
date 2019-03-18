import Koa from 'koa'
import http from 'http'
import https from 'https'

import KoaBody from 'koa-body'
import KoaCors from '@koa/cors'
import KoaStatic from 'koa-static'
import KoaRouter from 'koa-router'

import DB from '../lib/db'
import API from '../api/index'
import Locale from './locale'
import Auth from '../lib/auth/index'

import { staticPath, appsPath, envPort, error404, readSSL } from '../config'

export default class Server {
	constructor() {
		this.db = new DB()
		this.auth = new Auth()
		this.engine = new Koa()
		this.router = new KoaRouter()
		this.locale = new Locale()
		this.api = new API().use(this)
	}
	async applyMiddlewares() {
		const { engine, api, auth, router } = this

		await this.locale.initialize()
		;[
			new KoaBody({
				formLimit: '100mb',
				maxFieldsSize: 100 * 1024 * 1024
			}),
			KoaCors(),
			KoaStatic(staticPath),
			async (ctx, next) => {
				const {
					config: { headerKey }
				} = this.locale

				if (ctx.get(headerKey)) this.locale.current = ctx.get(headerKey)

				global.publicUrl = (ctx.req.connection.encrypted
					? 'https'
					: 'http'
				).concat('://', ctx.get('host'))

				if (appsPath) {
					await Promise.all(appsPath.map(dir => KoaStatic(dir)(ctx, next)))
				} else {
					await next()
				}
			},
			auth.prePassport(),
			auth.passport.initialize(),
			auth.afterPassport(),
			api.middleware(),
			router.routes(),
			router.allowedMethods(),
			async (ctx, next) => {
				if (ctx.status === 404) {
					const context = await error404()

					ctx.body = context || '404. Not found'
					ctx.status = 404
				} else {
					await next()
				}
			}
		].forEach(m => engine.use(m))

		try {
			await api.start()
		} catch (error) {
			console.log(error)
		}

		return engine.on('error', error => {
			console.log('Server error:', error)
		})
	}
	async start() {
		const { engine, db, api } = this

		try {
			await db.start()
		} catch (error) {
			console.log('Error start Sequelize:', error.message)

			process.exit()
		}

		try {
			await this.applyMiddlewares()
		} catch (error) {
			console.log('Error apply middlewares:', error)

			process.exit()
		}

		if (envPort('http')) {
			const httpServer = http.createServer(engine.callback())

			httpServer.listen(envPort('http'), async () => {
				console.log(`Server ready at http://localhost:${envPort('http')}`)

				await api.subscriptionServer(httpServer)
			})
		}

		if (envPort('https')) {
			try {
				const ssl = await readSSL()

				if (ssl) {
					const httpsServer = https.createServer(ssl, engine.callback())

					httpsServer.listen(envPort('https'), async () => {
						console.log(`Server ready at https://localhost:${envPort('https')}`)

						await api.subscriptionServer(httpsServer)
					})
				}
			} catch (error) {
				console.error(error)
			}
		}
	}
}
