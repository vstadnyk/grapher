import { transliterate, parameterize } from 'inflected'

import { fields } from './schema'
import Controller from '../../../proto/controller'
import User from '../../user/controller'

export default class extends Controller {
	get force() {
		return false
	}
	get table() {
		return 'config'
	}
	get fields() {
		return fields
	}
	get user() {
		return new User().use(this.db, this.auth, this.locale)
	}
	async reAdd(data, separator = '_') {
		Object.assign(data, {
			key: parameterize(transliterate(data.key), { separator }).trim(),
		})

		const { key } = data

		if (await this.exist({ key })) {
			const item = await this.edit({ key }, data)

			return item
		}

		const item = await this.add(data)

		return item
	}
	async set(key, value, separator = '_', name = null, description = null) {
		await this.add({
			key: parameterize(transliterate(key), { separator }).trim(),
			value,
			name,
			description,
		})

		return this.get(key)
	}
	async get(key) {
		const list = await this.list({ key })

		if (!list || !list.count) return null

		const map = new Map()

		for (const item of list.rows) {
			map.set(
				key,
				Object.keys(item.value).reduce(
					(m, i) => m.set(i, item.value[i]),
					new Map(),
				),
			)
		}

		return map.get(key)
	}
	async remove(where = {}) {
		if (!(await this.model.destroy({ where })))
			throw new Error(this.locale.get(`${this.table}_error_remove`))

		return true
	}
}
