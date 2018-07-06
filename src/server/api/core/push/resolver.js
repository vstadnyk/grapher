import Proto from '../../../proto/resolver'
import Controller from './controller'
import { schema } from './schema'

const controller = new Controller()

export default class extends Proto {
	constructor() {
		super()

		this.schema = schema
	}
	async pushTest(_, { title, body }, { db, locale, auth, pushserver }) {
		await controller
			.use(db, locale, auth, pushserver)
			.emit('onTest')
			.send(null, { title, body })

		return true
	}
	async _subscribePush(_, { input }, { db, locale, auth, pushserver }) {
		await controller
			.use(db, locale, auth, pushserver)
			.user.can(`${controller.table}-add`)

		await controller.user.can(`${controller.table}-edit`)

		await controller.subscribe(input)

		return true
	}
	async _removeSubscribePush(_, { input }, { db, locale, auth }) {
		await controller
			.use(db, locale, auth)
			.user.can(`${controller.table}-remove`)

		await controller.remove(input)

		return true
	}
}
