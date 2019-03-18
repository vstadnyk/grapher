import Proto from '../../lib/proto/resolver'
import Controller from './controller'
import { schema } from './schema'

const controller = new Controller()

export default class extends Proto {
	constructor() {
		super(schema)
	}
	async pushSubscriber(_, { input }, { db, locale, auth }, info) {
		controller.use(db, locale, auth)

		await controller.user.can(`${controller.table}-show`)

		return controller.subscriber(input, this.gFields(info))
	}
	async pushSubscribers(_, { input }, { db, locale, auth }, info) {
		controller.use(db, locale, auth)

		await controller.user.can(`${controller.table}-show`)

		return controller.subscribers(input, this.gFields(info).rows)
	}
	async pushTest(_, { event, users, vars, data }, { db, locale, auth }) {
		controller.use(db, locale, auth)

		// await controller.user.can(`${controller.table}-send`)
		await controller.emit(event).send({ users, vars, data })

		return true
	}
	async pushTemplateData(_, args, { db, locale, auth }) {
		controller.use(db, locale, auth)

		await controller.user.can(`${controller.table}-show-data`)

		return controller.config
	}
	async _subscribePush(_, { input }, { api, db, locale, auth }) {
		controller.use(db, locale, auth, api)

		await controller.user.can(`${controller.table}-subscribe`)
		await controller.subscribe(input)

		return true
	}
	async _removeSubscribePush(_, { input }, { db, locale, auth }) {
		controller.use(db, locale, auth)

		await controller.user.can(`${controller.table}-remove`)
		await controller.remove(input)

		return true
	}
}
