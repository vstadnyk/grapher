import Controller from '../../../proto/controller'

export default class extends Controller {
	constructor(parent) {
		super()

		this.parent = parent
	}
	data(data) {
		const { to, html } = data

		if (!to) throw new Error(this.parent.locale.get('mailer_error_to'))
		if (!html)
			throw new Error(this.parent.locale.get('mailer_error_nothing_to_send'))

		return data
	}
}
