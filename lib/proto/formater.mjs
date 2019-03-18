import Controller from './controller'

export default class extends Controller {
	constructor(parent) {
		super()

		this.parent = parent
	}
	async format(item, options, where) {
		await Promise.all(
			Object.entries(options)
				.filter(([key]) => this.has(key))
				.map(([key, option]) => this[key](item, option, where))
		)

		if (this.parent.fields) {
			this.parent.locale
				.getFields(this.parent.fields, 'image')
				.forEach(field => {
					Object.assign(item, {
						[`${field}String`]:
							global.publicUrl && item[field]
								? global.publicUrl.concat(item[field])
								: item[field]
					})
				})
		}

		return item
	}
	__keyValue(item, key = 'status') {
		if (!item[key]) return item

		const code = item[key]

		Object.assign(item, {
			[key]: {
				code,
				value: this.parent.locale.get(
					this.parent.table.concat('_', key, '_', code)
				)
			}
		})

		return item
	}
}
