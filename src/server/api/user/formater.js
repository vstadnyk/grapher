import Controller from '../../proto/controller'

export default class extends Controller {
	constructor(parent) {
		super()

		this.parent = parent
	}
	async output(user) {
		const { firstName, lastName, fullName } = user

		Object.assign(user, {
			fullName:
				!fullName && lastName
					? (firstName || '').concat(' ', lastName)
					: fullName || firstName,
		})

		return user
	}
}
