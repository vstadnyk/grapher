import Proto from '../../../proto/resolver'
import Controller from './controller'
import { schema } from './schema'

const controller = new Controller()

export default class extends Proto {
	constructor() {
		super()

		this.schema = schema
	}
	async location(_, { input }, { db, locale, auth }) {
		await controller.use(db, auth, locale).user.can(`${controller.table}-show`)

		return controller.location(input)
	}
	async locations(_, { input }, { db, locale, auth }) {
		await controller.use(db, auth, locale).user.can(`${controller.table}-show`)

		return controller.use(db, locale, auth).locations(input)
	}
	async _addLocation(_, { input }, { db, locale, auth }) {
		await controller.use(db, auth, locale).user.can(`${controller.table}-add`)

		await controller.addLocation(input)

		return true
	}
	async _editLocation(_, { input, id }, { db, locale, auth }) {
		await controller.use(db, auth, locale).user.can(`${controller.table}-edit`)

		await controller.editLocation(id, input)

		return true
	}
	async _removeLocation(_, { id }, { db, locale, auth }) {
		await controller.use(db, auth, locale).user.can(`${controller.table}-remove`)

		await controller.remove({ id })

		return true
	}
}
