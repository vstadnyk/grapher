import User from '../../user/controller'
import Controller from '../../../lib/proto/controller'

export default class extends Controller {
	get user() {
		return new User().use(this.db, this.auth, this.locale)
	}
}
