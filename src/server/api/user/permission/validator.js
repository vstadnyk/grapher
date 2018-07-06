import fs from 'fs'

import Controller from '../../../proto/controller'

export default class extends Controller {
	constructor(parent) {
		super()

		this.parent = parent
	}
	async validateModyfi(data) {
		const { alias } = data

		if (
			!alias ||
			(await this.parent.exist({
				alias,
			}))
		)
			throw new Error(
				this.parent.locale.get(`${this.parent.table}_error_exists`),
			)

		return data
	}
	async validateRole(role = false) {
		const { available } = this.parent

		if (!available.find(row => row === role)) {
			available.push(role)

			fs.writeFileSync(
				'./server-data/permissions.json',
				JSON.stringify(available.sort(), null, '\t'),
			)
		}

		return role
	}
}
