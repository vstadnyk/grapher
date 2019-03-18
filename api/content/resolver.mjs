import Proto from '../../lib/proto/resolver'
import Controller from './controller'
import { schema } from './schema'

const controller = new Controller()

export default class extends Proto {
	constructor() {
		super(schema)
	}
	content(_, { input }, { db, locale, auth }, info) {
		return controller
			.use(db, locale, auth)
			.content(input, this.gFields(info) || {})
	}
	contents(_, { input }, { db, locale, auth }, info) {
		return controller
			.use(db, locale, auth)
			.contents(input, this.gFields(info).rows || {})
	}
	async content_i18n(_, { input }, { db, locale, auth }) {
		controller.use(db, locale, auth)

		await controller.user.can(`${controller.table}-show`)

		const item = await controller.one(input, {
			l18n: locale.enabled
		})

		return item
	}
	async contents_i18n(_, { input }, { db, locale, auth }) {
		controller.use(db, locale, auth)

		await controller.user.can(`${controller.table}-show`)

		const list = await controller.list(input, {
			l18n: locale.enabled
		})

		return list
	}
	async _addContent(_, { input }, { db, locale, auth }) {
		controller.use(db, locale, auth)

		await controller.user.can(`${controller.table}-add`)
		await controller.add(input)

		return true
	}
	async _editContent(_, { input, id }, { db, locale, auth }) {
		controller.use(db, locale, auth)

		await controller.user.can(`${controller.table}-edit`)
		await controller.edit({ id }, input)

		return true
	}
	async _removeContent(_, { id }, { db, locale, auth }) {
		controller.use(db, locale, auth)

		await controller.user.can(`${controller.table}-remove`)
		await controller.remove({ id })

		return true
	}
}
