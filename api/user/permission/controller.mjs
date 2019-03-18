import Controller from '../../../lib/proto/controller'

import User from '../controller'
import { fields } from './schema'
import Validator from './validator'
import Loger from '../../loger'

export default class extends Controller {
	get force() {
		return false
	}
	get table() {
		return 'user-permissions'
	}
	get fields() {
		return fields
	}
	get loger() {
		return new Loger()
	}
	get validator() {
		return new Validator(this)
	}
	get rules() {
		const { storage } = this.locale
		const { table: key } = this

		if (!storage.has(key)) return null

		return storage.get(key)
	}
	async loadRules() {
		const { userPermissions: file } = this.loger.config
		const { storage } = this.locale
		const { table: key } = this

		const list = await this.loger.read(file)

		list.sort()

		storage.set(key, new Set(list))

		return true
	}
	get user() {
		return new User().use(this.db, this.auth, this.locale)
	}
	async permission(where = {}) {
		const item = await this.one(where)

		return item
	}
	async permissions(where = {}, filter = false) {
		const list = await this.list(where, false, filter)

		if (!list) return null

		return list
	}
	async addPermision(data = {}) {
		await this.validator.validateModyfi(data)

		await this.add(data)

		return true
	}
	async editPermision(data = {}, id) {
		await this.edit({ id }, data)

		return true
	}
	async editPermisionRule(where, key, value) {
		await this.validator.validateRule(key)

		const items = await this.permissions(where, false)

		if (!items) throw this.error('not_found')

		await Promise.all(
			items.rows.map(({ id, rules = {} }) => {
				Object.assign(rules, {
					[key]: !!value
				})

				return this.edit({ id }, { rules: this.__objectSort(rules) })
			})
		)

		return true
	}
	async delegateAll(where) {
		const items = await this.permissions(where, false)

		if (!items) throw this.error('not_found')

		if (!this.rules) await this.loadRules()

		const allRules = {}

		for (const rule of this.rules) {
			Object.assign(allRules, {
				[rule]: true
			})
		}

		await Promise.all(
			items.rows.map(({ id, rules = {} } = {}) =>
				this.edit(
					{ id },
					{ rules: Object.assign(rules || {}, this.__objectSort(allRules)) }
				)
			)
		)

		return true
	}
}
