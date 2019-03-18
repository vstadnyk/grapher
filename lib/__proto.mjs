import path from 'path'
import moment from 'moment'

export default class {
	get moment() {
		return moment
	}
	use(...args) {
		args
			.filter(fn => fn && fn.constructor && fn.constructor.name)
			.forEach(fn => {
				const name = fn.constructor.name.toLowerCase()

				if (!this[name] && this[name] !== fn) this[name] = fn
			})

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
				.concat([{}])
		)
	}
	__objectSort(o = {}) {
		return Object.keys(o)
			.sort()
			.reduce(
				(r, k) =>
					Object.assign({}, r, {
						[k]: o[k]
					}),
				{}
			)
	}
	__mapToObject(m) {
		return Object.assign(
			{},
			...Array(...m.entries()).map(([i, v]) => ({ [i]: v }))
		)
	}
	__objectToMap(o) {
		return Object.entries(o).reduce((m, [i, v]) => m.set(i, v), new Map())
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
	__filename(
		{ url } = {
			url: null
		} // import.meta
	) {
		if (typeof __filename === 'string') return __filename

		if (!url)
			return (
				/^ +at (?:file:\/*(?=\/)|)(.*?):\d+:\d+$/m.exec(Error().stack) || ''
			).find((r, i) => i === 1)

		return new URL(url).pathname
	}
	__dirname(meta) {
		if (typeof __dirname === 'string') return __dirname

		return path.dirname(this.__filename(meta))
	}
	__arrayPagination(
		array = [{}],
		{ sort = 'ASC', limit = 0, offset = 0 } = {},
		field = null
	) {
		const asc = (a, b) => ((a[field] || a) > (b[field] || b) ? -1 : 1)
		const desc = (a, b) => ((a[field] || a) > (b[field] || b) ? 1 : -1)

		if (sort.toUpperCase() === 'ASC') array.sort(asc)
		if (sort.toUpperCase() === 'DESC') array.reverse(desc)

		return limit ? array.slice(offset, offset + limit) : array
	}
}
