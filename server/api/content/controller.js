import Controller from '../../proto/controller'

import { fields } from './schema'
import Image from '../../image'
import User from '../user/controller'

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
}
