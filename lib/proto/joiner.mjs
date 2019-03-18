import Controller from './controller'

export default class extends Controller {
	constructor(parent) {
		super()

		this.parent = parent
	}
	async join(item, options) {
		await Promise.all(
			Object.entries(options)
				.filter(([key]) => this.has(key))
				.map(([key, option]) => this[key](item, option))
		)

		return item
	}
	async userFull(item, options) {
		if (!this.parent.user) return item

		const { user: id } = item

		const userFull = await this.parent.user.user({ id }, options)

		Object.assign(item, { userFull })

		return item
	}
}
