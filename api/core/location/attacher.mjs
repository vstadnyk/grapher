import Controller from '../../../lib/proto/controller'

export default class extends Controller {
	constructor(parent) {
		super()

		this.parent = parent
	}
	async attach(
		item = null,
		options = {
			formatAddress: true
		}
	) {
		if (!item) return item

		await Promise.all(
			Object.entries(options)
				.filter(([key]) => this.has(key))
				.map(([key, option]) => this[key](item, option))
		)

		return item
	}
	async addToUser(item, userWhere = {}) {
		const user = await this.parent.user.user(userWhere)

		if (!user) return item

		const locations = new Set(user.locations || [])

		await this.parent.user.edit(
			{
				id: user.id
			},
			{
				locations: [...locations.add(item.id)]
			}
		)

		return item
	}
}
