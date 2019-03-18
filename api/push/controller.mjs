import { fields, config } from './schema'
import Controller from '../../lib/proto/controller'

import Logs from './log/controller'
import User from '../user/controller'
import Firebase from '../../lib/firebase'
import Template from '../../lib/template'
import Templates from './template/controller'

import Validator from './validator'
import Joiner from './joiner'

const firebase = new Firebase()

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
	get config() {
		return config
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
	get validator() {
		return new Validator(this)
	}
	get joiner() {
		return new Joiner(this)
	}
	get ctx() {
		return this.api.ctx
	}
	get firebase() {
		if (!this._firebase) this._firebase = firebase

		return this._firebase
	}
	async subscriber(where = {}, options = {}) {
		await this.validator.where(where)

		const item = await this.one(where)

		await this.joiner.join(item, options)

		return item
	}
	async subscribers(where = {}, options = {}) {
		await this.validator.where(where)

		const list = await this.list(where)

		if (!list) return null

		const rows = await Promise.all(
			list.rows.map(row => this.joiner.join(row, options))
		)

		Object.assign(list, { rows })

		return list
	}
	async subscribe(data) {
		await this.validator.data(data)

		const { app } = data
		const { eventsPack = {} } = this.config

		if (!data.events) {
			Object.assign(data, {
				events: eventsPack[app] || []
			})
		}

		return Promise.all(data.events.map(event => this._subscribe(event, data)))
	}
	async _subscribe(event = '', data) {
		if (!this.config.events.find(p => p === event))
			throw this.error('event_not_valid')

		await this.validator.data(data)

		const { user, app, platform } = data
		const where = {
			event,
			user,
			app,
			platform
		}

		const _data = Object.assign({}, data, { event })
		delete _data.events

		if (!(await this.exist(where))) {
			await this.add(_data)
		} else {
			await this.edit(where, _data)
		}
	}
	emit(event) {
		const { events } = this.config

		if (!events.find(e => e === event)) {
			this.event = false

			return this
		}

		this.event = event

		return this
	}
	async renderMessage(vars = {}, data = {}) {
		const tmpl = await this.templates.one(
			{
				event: this.event,
				active: true
			},
			{
				l18n: this.locale.enabled
			}
		)

		return tmpl
			? Promise.all(
					this.locale.enabled.map(async lang => ({
						lang,
						data,
						title: await Template.renderStr(
							tmpl.title.find(row => row.lang === lang).value,
							vars,
							true
						),
						body: await Template.renderStr(
							tmpl.body.find(row => row.lang === lang).value,
							vars,
							true
						)
					}))
			  )
			: null
	}
	async send({ users, vars, data }) {
		const { event } = this

		if (!event) return null

		const where = { event, active: true }

		if (users) Object.assign(where, { user: users })

		const subscribers = await this.list(where)

		if (!subscribers) return null

		const templates = await this.renderMessage(vars, data)

		await Promise.all(
			subscribers.rows.map(subscriber => this.sendTo(subscriber, templates))
		)

		return true
	}
	async sendTo({ token, lang, user, event, app, platform }, templates) {
		if (!templates) throw this.error('template_not_found')

		const message = templates.find(row => row.lang === lang) || {}

		try {
			await this.firebase.send(token, message)

			await Promise.all(
				templates.map(row =>
					this.log.add(
						Object.assign({}, row, {
							user,
							event,
							app,
							platform
						})
					)
				)
			)
		} catch (error) {
			console.log(error)

			const {
				errorInfo: { code }
			} = error

			if (
				[
					'messaging/invalid-registration-token',
					'messaging/registration-token-not-registered'
				].find(row => row === code)
			) {
				await this.remove({ token })
			}
		}
	}
}
