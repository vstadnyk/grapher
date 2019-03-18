import Controller from '../../lib/proto/controller'
import { jwt as config } from '../../config'

import Image from '../../lib/image'
import { fields } from './schema'
import Mailer from '../core/mail/controller'
import Location from '../core/location/controller'
import Permissions from './permission/controller'

import Validator from './validator'
import Joiner from './joiner'
import Formater from './formater'
import Authorization from './authorization'

export default class extends Controller {
	get table() {
		return 'users'
	}
	get fields() {
		return fields
	}
	get config() {
		return config
	}
	get force() {
		return false
	}
	get image() {
		return new Image()
	}
	get location() {
		return new Location().use(this.api, this.db, this.auth, this.locale)
	}
	get permissions() {
		return new Permissions().use(this.db, this.auth, this.locale)
	}
	get mailer() {
		return new Mailer().use(this.db, this.auth, this.locale)
	}
	get validator() {
		return new Validator(this)
	}
	get joiner() {
		return new Joiner(this)
	}
	get formater() {
		return new Formater(this)
	}
	get authorization() {
		return new Authorization(this)
	}
	set _current(user) {
		this._currentUser = user

		return this._current
	}
	get _current() {
		return this._currentUser
	}
	async current(options) {
		this._current = false
		let authUser = null

		const apptype = this.auth.ctx.get('apptype')
		const appplatform = this.auth.ctx.get('appplatform')

		if (!apptype) throw this.error('apptype_not_found')
		if (!appplatform) throw this.error('appplatform_not_found')

		const { deadTokenHeaderStatus = 203 } = config

		try {
			authUser = await this.auth.ping()
		} catch (error) {
			console.log(error)
			throw this.error('jwt_auth')
		}

		if (!authUser)
			throw this.error(
				'invalid_accessToken',
				null,
				['android', 'ios'].find(row => row === appplatform)
					? deadTokenHeaderStatus
					: 203
			)

		const user = await this.user({ rid: authUser.id }, options)

		if (!user) throw this.error('not_found')
		if (!user.active) throw this.error('disable')

		await this.validator.instance(user, apptype)

		this._current = user

		return this._current
	}
	async changePass(data) {
		if (!data.id) {
			const { rid } = await this.current()

			Object.assign(data, { rid })
		}

		const { id, pass, currentPass, rid } = data

		if (!rid && id) {
			const user = await this.one(
				{ id },
				{
					attributes: ['rid']
				}
			)

			if (!user) throw this.error('not_found')

			Object.assign(data, {
				rid: user.rid
			})
		}

		if (!data.rid) throw this.error('change_pass')

		try {
			await this.auth.changePass(data.rid, pass, currentPass)
		} catch ({ type }) {
			if (type === 'AUTH_NOT_EQUAL_PASS')
				throw this.error('current_password_is_not_correct', type)
			if (type === 'AUTH_NOT_FOUND') throw this.error('not_found', type)
		}

		return true
	}
	async logout() {
		await this.authorization.logout()

		this._current = false

		return true
	}
	async user(where = false, options, filter = row => row) {
		if (!where) throw this.error('arguments_required')

		const user = await this.one(where)

		if (!user) return user

		await this.joiner.join(user, options)
		await this.formater.output(user)

		if (!filter(user)) return null

		return user
	}
	async users(where = {}, options, filter = row => row) {
		const list = await this.list(where)

		if (!list) return null

		let { count, rows } = list

		rows = await Promise.all(rows.map(row => this.joiner.join(row, options)))
		rows = await Promise.all(
			rows.map(row => this.formater.output(row, options))
		)

		rows.forEach((row, index) => {
			if (!filter(row)) {
				count -= 1
				delete rows[index]
			}
		})

		return {
			count,
			rows
		}
	}
	async addUser(data = {}, options = false) {
		await this.validator.data(data)

		return this.authorization.register(data, options)
	}
	async editUser(where = {}, data = {}, options = false) {
		await this.validator.where(where)

		const _user = await this.one(where)

		if (!_user) throw this.error('not_found')

		await this.validator.data(data, ['mail'], _user)

		await this.edit(where, data)

		if (!options) return true

		const user = await this.user(where, options)

		return user
	}
	async removeUsers(where, ignoreErrors = false) {
		const list = await this.list(where, {
			attributes: ['rid']
		})

		if (!list && ignoreErrors) return null

		if (!list && !ignoreErrors) throw this.error('not_found')

		await Promise.all(
			list.rows.map(user =>
				this.auth.User.model
					.get(user.get('rid'))
					.delete()
					.run()
			)
		)

		await this.remove(where, ignoreErrors)

		return true
	}
	async sendMail(id, mailer = {}, lang = 'en') {
		const user = await this.user({ id })

		const { mail: to } = user

		Object.assign(mailer.vars || {}, { user })
		Object.assign(mailer || {}, { to })

		this.locale.current = lang

		const send = await this.mailer.send(mailer, lang)

		return send
	}
	async can(rule = false) {
		await this.permissions.validator.validateRule(rule)

		const { permission = {} } = (await this.current()) || {}

		const { rules } = permission || {}
		const find = Object.keys(permission.rules || []).find(row => row === rule)

		if (!find || !rules[find])
			throw this.error('permission_denied', null, 200, `: ${rule}`)

		return true
	}
}
