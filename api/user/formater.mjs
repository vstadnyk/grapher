import Proto from '../../lib/proto/formater'

export default class extends Proto {
	constructor(parent) {
		super()

		this.parent = parent
	}
	async output(user) {
		const { firstName, lastName, fullName } = user

		this.parent.locale.getFields(this.parent.fields, 'image').forEach(field => {
			Object.assign(user, {
				[`${field}String`]:
					global.publicUrl && user[field]
						? global.publicUrl.concat(user[field])
						: user[field]
			})
		})

		Object.assign(user, {
			fullName:
				!fullName && lastName
					? (firstName || '').concat(' ', lastName)
					: fullName || firstName
		})

		return user
	}
}
