import Controller from '../../../proto/controller'

export default class extends Controller {
	constructor(parent) {
		super()

		this.parent = parent
	}
	async attach(
		item,
		options = {
			formatAddress: true
		}
	) {
		for (const [option, value] of Object.entries(options)) {
			if (value && this.has(option)) {
				await this[option](item, value)
			}
		}

		return item
	}
	async addToUser(item, userWhere) {
		const user = await this.parent.user.user(userWhere)

		if (!user) return item

		const location = new Set(user.location || [])

		if (user.location) {
			for (const id of location.values()) {
				if (id && !(await this.parent.exist({ id })))
					location.delete(id)
			}
		}
console.log(item)
		await this.parent.user.editUser(
			{
				id: user.id
			},
			{
				location: [...location.add(item.id)]
			}
		)

		return item
	}
}
