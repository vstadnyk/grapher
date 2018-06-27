import moment from 'moment'

export default class {
	get moment() {
		return moment
	}
	use(...args) {
		args.filter(fn => fn && fn.constructor && fn.constructor.name).forEach(
			fn => {
				const name = fn.constructor.name.toLowerCase()

				if (!this[name] && this[name] !== fn) this[name] = fn
			}
		)

		return this
	}
	has(option) {
		return !!this[option]
	}
	__objectFilter(o = {}, callback = () => {}) {
		return Object.assign(
			...Object.entries(o)
				.filter(([k, v]) => callback(k, v))
				.map(([k, v]) => ({ [k]: v }))
		)
	}
	__objectSort(o = {}) {
		return Object.keys(o)
			.sort((a, b) => a > b)
			.reduce((r, k) => {
				// r[k] = o[k]

				Object.assign(r, {
					[k]: o[k]
				})

				return r
			}, {})
	}
	__mapToObject(m) {
		const o = {}

		if (!m.forEach) return m

		m.forEach((v, i) => {
			o[i] = v
		})

		return o
	}
	*__iterate() {
		const methods = Object.getOwnPropertyNames(
			Object.getPrototypeOf(this)
		).filter(r => r !== 'constructor' && r.indexOf('__') === -1)

		for (const method of methods) {
			yield this[method]
		}
	}
	get __methods() {
		return [].concat(...this.__iterate())
	}
}
