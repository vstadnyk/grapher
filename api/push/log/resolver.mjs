import Proto from '../../../lib/proto/resolver'
import Controller from './controller'
import { schema } from './schema'

const controller = new Controller()

export default class extends Proto {
	constructor() {
		super(schema)
	}
	pushLog(_, { input = {} }, { api, db, locale, auth }, info) {
		return controller.use(api, db, locale, auth).log(input, this.gFields(info))
	}
	pushLogs(_, { input = {} }, { api, db, locale, auth }, info) {
		return controller
			.use(api, db, locale, auth)
			.logs(input, this.gFields(info).rows)
	}
	async pushLogsTotal(_, { input = {} }, { api, db, auth, locale }) {
		await controller.use(api, db, locale, auth).validateWhere(input)

		return controller.exist(input)
	}
	async _removePushLog(_, { input = {} }, { api, db, locale, auth }) {
		controller.use(api, db, locale, auth)

		await controller.user.can(`${controller.table}-remove`)
		await controller.remove(input)

		return true
	}
}
