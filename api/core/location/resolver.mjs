import Proto from '../../../lib/proto/resolver'
import Controller from './controller'
import { schema } from './schema'

const controller = new Controller()

export default class extends Proto {
	constructor() {
		super(schema)
	}
	async location(_, { input }, { db, locale, auth }) {
		await controller.use(db, auth, locale).user.can(`${controller.table}-show`)

		return controller.one(input, {
			l18n: locale.current
		})
	}
	async locations(_, { input }, { db, locale, auth }) {
		await controller.use(db, auth, locale).user.can(`${controller.table}-show`)

		return controller.list(input, {
			l18n: locale.current
		})
	}
	async location_i18n(_, { input }, { db, locale, auth }) {
		controller.use(db, locale, auth)

		await controller.user.can(`${controller.table}-show`)

		const item = await controller.one(input, {
			l18n: locale.enabled
		})

		return item
	}
	async locations_i18n(_, { input }, { db, locale, auth }) {
		controller.use(db, locale, auth)

		await controller.user.can(`${controller.table}-show`)

		const list = await controller.list(input, {
			l18n: locale.enabled
		})

		return list
	}
	async gmapLocation(
		_,
		{ coord = {}, lang = null },
		{ api, db, locale, auth },
		info
	) {
		controller.use(api, db, locale, auth)

		await controller.user.can(`${controller.table}-gmapLocation`)

		const { country, city, street, building } = this.gFields(info)

		return controller.gmapLocation(
			coord,
			{
				sendRequest: !!country || !!city || !!street || !!building
			},
			lang
		)
	}
	async _addLocation(_, { input }, { db, locale, auth }) {
		await controller.use(db, auth, locale).user.can(`${controller.table}-add`)

		const { id } = await controller.addLocation(input, {})

		return id || null
	}
	async _editLocation(_, { input, id }, { db, locale, auth }) {
		await controller.use(db, auth, locale).user.can(`${controller.table}-edit`)

		await controller.editLocation(id, input)

		return true
	}
	async _removeLocation(_, { id }, { db, locale, auth }) {
		controller.use(db, locale, auth)

		await controller.user.can(`${controller.table}-remove`)
		await controller.remove({ id })

		return true
	}
}
