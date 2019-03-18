import Proto from '../../../lib/proto/resolver'
import Controller from './controller'
import schema from './schema'

const controller = new Controller()

export default class extends Proto {
	constructor() {
		super(schema)
	}
	async mailConfig(_, { key = null }, { db, locale, auth }) {
		controller.use(db, auth, locale)
		await controller.user.can(`${controller.table}-show-config`)

		const config = await controller.config(key)

		return this.__mapToObject(config)
	}
	async _sendMail(_, { input }, { db, locale, auth }) {
		await controller.use(db, auth, locale).user.can('mail-send')

		await controller.send(input)

		return true
	}
}
