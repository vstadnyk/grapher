import Controller from '../../proto/controller'

import Image from '../../image'
import { fields } from './schema'
import Mailer from '../core/mail/controller'
import { user as config } from '../../config'
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
		return new Location().use(this.db, this.auth, this.locale)
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
	async current() {
		try {
			await this.auth.ping()
		} catch (error) {
			throw new Error(this.locale.get(`${this.table}_error_jwt_auth`))
		}

		if (!this.auth.user)
			throw new Error(this.locale.get(`${this.table}_error_accessToken`))

		const user = await this.user(
			{
				rid: this.auth.user.id
			},
			{
				joinPermission: true
			}
		)

		if (!user)
			throw new Error(this.locale.get(`${this.table}_error_not_found`))
		if (!user.active)
			throw new Error(this.locale.get(`${this.table}_error_disabled`))

		await this.validator.instance(user)

		this._current = user

		return this._current
	}
	async changePass(data) {
		if (!data.id) {
			const { rid } = await this.current()

			Object.assign(data, {
				rid
			})
		}

		const { id, pass, currentPass, rid } = data

		if (!rid && id) {
			const user = await this.one(
				{ id },
				{
					attributes: ['rid']
				}
			)
	
			if (!user) throw new Error(this.locale.get(`${this.table}_error_not_found`))

			Object.assign(data, {
				rid: user.get('rid')
			})
		}

		if (!data.rid) throw new Error(this.locale.get(`${this.table}_error_change_pass`))

		await this.auth.changePass(data.rid, pass, currentPass)

		return true
	}
	async logout() {
		await this.authorization.logout()
		
		this._current = false

		return true
	}
	async user(where = false, options, filter = row => row) {
		if (!where)
			throw new Error(
				this.locale.get(`${this.table}_error_arguments_required`)
			)

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

		let { count } = list

		const rows = []

		for (const user of list.rows.map(row => (row.get ? row.get() : row))) {
			await this.joiner.join(user, options)
			await this.formater.output(user)

			if (filter(user)) {
				rows.push(user)
			} else {
				count -= 1
			}
		}

		return {
			count,
			rows
		}
	}
	async addUser(data = {}, options = false) {
		await this.validator.data(data)

		return this.authorization.register(data, options)
	}
	async editUser(where = {}, data, options = false) {
		await this.validator.where(where)

		const _user = await this.one(where)

		if (!_user)
			throw new Error(this.locale.get(`${this.table}_error_not_found`))

		await this.validator.data(data, [], _user)

		await this.edit(where, data)

		if (!options) return true

		const user = await this.user(where, options)

		return user
	}
	async removeUsers(where, errors = true) {
		const rUsers = await this.auth.User.model

		for (const rUser of rUsers) {
			if (
				!(await this.model.count({
					where: {
						mail: rUser.mail
					}
				}))
			)
				await this.auth.User.model
					.get(rUser.id)
					.delete()
					.run()
		}

		const list = await this.list(where, {
			attributes: ['id', 'rid', 'photo']
		})

		if (!list && !errors) return null

		if (!list)
			throw new Error(this.locale.get(`${this.table}_error_not_found`))

		for (const user of list.rows) {
			try {
				await this.auth.User.model
					.get(user.get('rid'))
					.delete()
					.run()
			} catch (error) {
				console.log(error)
			}
		}

		await this.image.unlink(list.rows.map(row => row.get('photo')))
		await this.model.destroy({
			where
		})

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
		await this.permissions.validator.validateRole(rule)

		const current = await this.current()

		const { rules } = current.permission || {}
		const find = Object.keys(rules).find(row => row === rule)

		if (!find)
			throw new Error(`${this.locale.get('permission_denied')}: ${rule}`)

		return true
	}
}
