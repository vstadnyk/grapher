import Proto from '../../../proto/resolver'
import schema from './schema'
import Controller from './controller'

const controller = new Controller()

export default class extends Proto {
	constructor() {
		super()

		this.schema = schema
	}
	async locales(_, { key, lang }, { db, auth, locale }) {
		await controller.use(db, locale, auth).user.can(`locale-show`)

		return key ? locale.get(key) : locale.getDic(lang)
	}
	async _modifyLocale(_, { input, lang }, { db, auth, locale }) {
		await controller.use(db, locale, auth).user.can(`locale-edit`)

		locale.setObject(input, lang)

		return true
	}
}
