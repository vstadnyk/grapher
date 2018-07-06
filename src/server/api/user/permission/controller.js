import Controller from '../../../proto/controller'

import User from '../controller'
import { fields } from './schema'
import Validator from './validator'
import available from '../../../../../static/server-data/permissions.json'

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
	get available() {
		return available
	}
	get user() {
		return new User().use(this.db, this.auth, this.locale)
	}
	get validator() {
		return new Validator(this)
	}
	async addPermision(data = {}) {
		await this.validator.validateModyfi(data)

		await this.add(data)

		return true
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
	async editPermisionRole(where, key, value) {
		await this.validator.validateRole(key)

		const items = await this.permissions(where, false)

		if (!items)
			throw new Error(this.locale.get(`${this.tabke}_error_not_found`))

		for (const item of items.rows) {
			const { id } = item

			const rules = item.rules || {}

			Object.assign(rules, {
				[key]: !!value,
			})

			await this.edit({ id }, { rules: this.__objectSort(rules) })
		}

		return true
	}
	async delegateAll(where) {
		const items = await this.permissions(where, false)

		if (!items)
			throw new Error(this.locale.get(`${this.tabke}_error_not_found`))

		const rules = {}

		for (const rule of available) {
			Object.assign(rules, {
				[rule]: true,
			})
		}

		for (const item of items.rows.map(row => (row.get ? row.get() : row))) {
			const { id } = item

			await this.edit(
				{ id },
				{ rules: Object.assign(item.rules || {}, this.__objectSort(rules)) },
			)
		}

		return true
	}
}
