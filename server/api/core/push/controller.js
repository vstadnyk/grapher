import { fields, config } from './schema'
import Controller from '../../../proto/controller'

import User from '../../user/controller'
import Templates from './template/controller'
import Template from '../../../template'
import Logs from './log/controller'
import Config from '../config/controller'
import Loger from '../../loger'

export default class extends Controller {
	get force() {
		return false
	}
	get table() {
		return 'push-subscribers'
	}
	get fields() {
		return fields
	}
	get user() {
		return new User().use(this.db, this.auth, this.locale)
	}
	get templates() {
		return new Templates().use(this.db, this.auth, this.locale)
	}
	get log() {
		return new Logs().use(this.db, this.auth, this.locale)
	}
	get loger() {
		return new Loger()
	}
	get configDB() {
		return new Config().use(this.db, this.auth, this.locale)
	}
	async config(key = false) {
		this._config = await this.configDB.get('push_config')

		if (!this._config) {
			this._config = await this.configDB.set(
				'push_config',
				config,
				'_',
				'Push config',
				'Main push config'
			)
		}

		return key ? this._config.get(key) : this._config
	}
	async validateData(data = {}) {
		const { token, platform, event } = data
		const { platforms, events } = await this.config()
		const app = this.auth.ctx.get('apptype')

		if (!token)
			throw new Error(this.locale.get(`${this.table}_error_token_required`))

		if (platforms.indexOf(platform) === -1)
			throw new Error(this.locale.get(`${this.table}_error_platform_not_found`))

		if (events.indexOf(event) === -1)
			throw new Error(this.locale.get(`${this.table}_error_event_not_found`))

		Object.assign(data, {
			lang: data.lang || this.locale.current,
			app
		})

		return data
	}
	async subscribe(data) {
		await this.validateData(data)

		const { event, user, platform, app } = data
		const where = {
			event,
			user,
			app,
			platform,
			active: true
		}

		if (!(await this.exist(where))) {
			await this.add(data)
		} else {
			await this.edit(where, data)
		}

		return true
	}
	async remove(where = {}) {
		await this.validateData(where)

		if (!(await this.exist(where)))
			throw new Error(this.locale.get(`${this.table}_not_found`))

		if (
			!(await this.model.destroy({
				where
			}))
		)
			throw new Error(this.locale.get(`${this.table}_error_remove`))

		return true
	}
	emit(event) {
		this.event = event

		return this
	}
	async send(data, template = false, user = false) {
		const { event } = this

		if (!event)
			throw new Error(this.locale.get(`${this.table}_error_event_not_set`))

		const where = {
			event
		}

		if (user) Object.assign(where, { user })

		const subscribers = await this.list(where)

		if (!subscribers || !subscribers.count) return null

		Object.assign(subscribers, {
			rows: subscribers.rows.map(row => (row.get ? row.get() : row))
		})

		for (const subscriber of subscribers.rows) {
			await this._send(subscriber, data, template)
		}

		return true
	}
	async _send(subscriber, args, template = false) {
		const {
			token,
			event,
			app,
			platform,
			lang,
			execut,
			user
		} = subscriber

		const tmpl =
			template ||
			(await this.templates.item(
				{
					app,
					platform,
					event,
					active: true
				},
				false,
				lang
			))

		const message = this.formatMessage(
			Object.assign(tmpl || {}, {
				args,
				lang,
				execut
			})
		)

		if (typeof args === 'object') {
			for (const key of ['title', 'body']) {
				const str = await Template.renderStr(message[key], args, true)

				Object.assign(message, {
					[key]: str
				})
			}
		}

		await this.pushserver.send(
			token,
			Object.assign({}, message, {
				args: {
					id: message.args ? message.args.id : null,
					execut: message.args ? message.args.execut : null
				}
			}),
			async (send, error) => {
				if (error) {
					console.log(error)

					new Loger(this.auth.ctx).logError(error)

					await this.model.destroy({
						where: {
							id: subscriber.id
						}
					})
				}
			}
		)

		if (event === 'onTest') return true

		await this.log.add(
			Object.assign(
				{},
				Object.assign({}, message, {
					args: JSON.stringify(message.args)
				}),
				{
					user,
					event
				}
			)
		)

		return true
	}
	formatMessage(message = {}) {
		const { title, body, args, lang, execut } = message

		return {
			title,
			lang,
			body,
			execut,
			args
		}
	}
}
