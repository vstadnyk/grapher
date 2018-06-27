import fs from 'fs'
import { createServer } from 'https'
import Koa from 'koa'
import Body from 'koa-body'
import Cors from '@koa/cors'
import Serve from 'koa-static'

import DB from './db'
import Router from './router'
import Locale from './locale'
import API from './api/index'
import Auth from './auth/index'
import PushServer from './push'
import App from '../app/index'

import { server as config } from './config'

export default class Server {
	constructor() {
		this.engine = new Koa()
		this.auth = new Auth()
		this.router = new Router()
		this.DB = new DB()
		this.API = new API()
		this.locale = new Locale()
	}
	get __dev() {
		return !process.env.NODE_ENV || process.env.NODE_ENV !== 'production'
	}
	async use() {
		const router = await this.router.initialize()

		const context = {
			db: this.DB,
			auth: this.auth,
			locale: this.locale,
			pushserver: new PushServer()
		}

		router.get('/', ctx => new App(ctx).use(this.locale).body())

		try {
			await this.API.initialize(router, context)
		} catch (error) {
			throw new Error(`API compile error: ${error}`)
		}

		;[
			Cors(),
			new Body(),
			async (ctx, next) => {
				const { fields, files } = ctx.request.body

				global.publicUrl = ctx.get('host')

				this.locale.init()

				if (fields && files)
					ctx.request.body = Object.assign(fields, files)

				if (ctx.get(this.locale.config.headerKey))
					this.locale.current = ctx.get(this.locale.config.headerKey)

				try {
					await next()
				} catch (err) {
					ctx.status = err.status || 500
					ctx.body = err.message
				}
			},
			Serve(config.staticPath),
			this.auth.prePassport(),
			this.auth.passport.initialize(),
			this.auth.afterPassport(),
			router.routes(),
			router.allowedMethods()
		].forEach(m => this.engine.use(m))

		return this.engine.on('error', error => {
			throw new Error(`Server error: ${JSON.stringify(error)}`)
		})
	}
	async start() {
		try {
			await this.DB.start()
		} catch (error) {
			console.log(`Error start Sequelize`, error)
		}

		await this.use()

		this.engine.listen(config.port, () =>
			console.log(`Server start at http://localhost:${config.port}`)
		)

		const { ssl } = config

		createServer(
			{
				key: fs.readFileSync(ssl.key).toString(),
				cert: fs.readFileSync(ssl.cert).toString()
			},
			this.engine.callback()
		).listen(ssl.port, () =>
			console.log(`Server start at https://localhost:${ssl.port}`)
		)
	}
}
