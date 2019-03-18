import Controller from '../../../lib/proto/controller'

export default class extends Controller {
	constructor(parent) {
		super()

		this.parent = parent
	}
	data(
		data = {
			to: null,
			html: null
		}
	) {
		const { to, html } = data

		if (!to) throw this.parent.error('invalid_to')
		if (!html) throw this.parent.error('nothing_to_send')

		return data
	}
}
