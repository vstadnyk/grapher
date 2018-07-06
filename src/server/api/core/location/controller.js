import { fields } from './schema'
import Controller from '../../../proto/controller'

import User from '../../user/controller'
import Gmap from '../../../../lib/gmap'

import Validator from './validator'
import Attacher from './attacher'

export default class extends Controller {
	get force() {
		return false
	}
	get table() {
		return 'locations'
	}
	get fields() {
		return fields
	}
	get translateFields() {
		return this.locale.getFields(fields)
	}
	get user() {
		return new User().use(this.db, this.auth, this.locale)
	}
	get gmap() {
		return new Gmap()
	}
	get validator() {
		return new Validator(this)
	}
	get attacher() {
		return new Attacher(this)
	}
	async location(
		where,
		options = {
			translations: false,
		},
	) {
		const { translations } = options

		const item = await this.item(where, translations)

		return item
	}
	async locations(
		where,
		options = {
			translations: false,
		},
	) {
		const { translations } = options

		const list = await this.items(where, translations)

		return list
	}
	async modifyLocation(data, options) {
		const { id } = data

		return id
			? this.editLocation(id, data, options)
			: this.addLocation(data, options)
	}
	async addLocation(data, options) {
		await this.validator.data(data, options)

		const { id } = await this.addItem(data)

		if (options) {
			const item = await this.location({ id }, options)

			await this.attacher.attach(item, options)

			return item
		}

		return true
	}
	async editLocation(id, data, options) {
		await this.validator.data(data, options)

		await this.editItem(id, data)

		if (options) {
			const item = await this.location({ id }, options)

			await this.attacher.attach(item, options)

			return item
		}

		return true
	}
}
