import Proto from '../../../../proto/resolver'
import Controller from './controller'
import { schema } from './schema'

const controller = new Controller()

export default class extends Proto {
	constructor() {
		super()

		this.schema = schema
	}
	async pushLog(_, { input }, { db, locale, auth }) {
		await controller.use(db, auth, locale).user.can(`${controller.table}-show`)

		return controller.pushLog(input)
	}
	async pushLogs(_, { input }, { db, locale, auth }) {
		await controller.use(db, auth, locale).user.can(`${controller.table}-show`)

		return controller.pushLogs(input)
	}
	async _removePushLog(_, { id, input }, { db, locale, auth }) {
		await controller
			.use(db, auth, locale)
			.user.can(`${controller.table}-remove`)

		await controller.remove(id, input)

		return true
	}
}
