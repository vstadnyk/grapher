import Controller from '../../lib/proto/controller'

import { fields } from './schema'
import Image from '../../lib/image'
import User from '../user/controller'

import Formater from './formater'

export default class extends Controller {
	get table() {
		return 'contents'
	}
	get fields() {
		return fields
	}
	get translateFields() {
		return this.locale.getFields(fields)
	}
	get image() {
		return new Image()
	}
	get user() {
		return new User().use(this.db, this.auth, this.locale)
	}
	get formater() {
		return new Formater(this)
	}
	async content(where = {}, options = {}) {
		const item = await this.one(where, {
			l18n: this.locale.current
		})

		this.formater.format(item, options)

		return item
	}
	async contents(where = {}, options = {}) {
		const { count, rows } = await this.list(where, {
			l18n: this.locale.current
		})

		return { count, rows: rows.map(row => this.formater.format(row, options)) }
	}
}
