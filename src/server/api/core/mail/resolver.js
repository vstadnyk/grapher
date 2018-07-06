import Proto from '../../../proto/resolver'
import Controller from './controller'
import schema from './schema'

const controller = new Controller()

export default class extends Proto {
	constructor() {
		super()

		this.schema = schema
	}
	async _sendMail(_, { input }, { db, locale, auth }) {
		await controller.use(db, auth, locale).can('mail-send')

		await controller.send(input)

		return true
	}
}
