import Controller from './controller'

export default class extends Controller {
	constructor(parent) {
		super()

		this.parent = parent
	}
	async data(data = {}, item = null, ignore = []) {
		await Promise.all(
			Object.entries(this.parent.fields || {})
				.filter(([name]) => this.has(name) && !ignore.find(row => row === name))
				.map(([name]) => this[name](data, item))
		)

		return data
	}
}
