import Proto from '../../lib/__proto'

export default class extends Proto {
	get model() {
		this.__validate()

		const model = this.db.model(this.table, this.fields)

		model.sync({
			force: this.force,
		})

		return model
	}
	__validate() {
		const { name } = this.constructor

		if (!this.db) throw new Error(`${name}: this.db is undefined`)
		if (!this.db.model) throw new Error(`${name}: this.db.model is undefined`)
		if (!this.table) throw new Error(`${name}: this.table is undefined`)
		if (!this.fields) throw new Error(`${name}: this.fields is undefined`)

		return true
	}
	async exist(where = {}) {
		return this.model.count({ where })
	}
	async list(
		where = false,
		options = {
			l18n: false,
			filter: false,
			attributes: false,
		},
	) {
		const { l18n, filter, attributes } = options
		const { Op } = this.db.orm

		const query = {
			order: [],
			offset: 0,
			where,
		}

		if (attributes && attributes.length) Object.assign(query, { attributes })

		if (query.where.params) {
			const { params } = query.where
			const { sort, limit, offset, search } = params

			delete query.where.params

			if (sort)
				query.order.push([sort.column || 'id', sort.direction || 'DESC'])

			if (search && search.column) {
				for (const [key, value] of Object.entries(search)) {
					if (typeof value === 'string') {
						Object.assign(where, {
							[search.column]: {
								[Op[key]]: value,
							},
						})
					}
				}
			}

			if (search && search.columns) {
				for (const [key, value] of Object.entries(search)) {
					if (typeof value === 'string') {
						const or = []

						for (const column of search.columns) {
							or.push({
								[column]: {
									[Op[key]]: value,
								},
							})
						}

						Object.assign(where, {
							[Op.or]: or,
						})
					}
				}
			}

			if (typeof limit === 'number') {
				query.limit = limit
				query.offset = offset
			}
		}

		if (l18n)
			Object.assign(query, {
				where: Object.assign(where || {}, {
					lang: this.locale.def,
				}),
			})

		const result = await this.model.findAndCountAll(query)

		if (!result || !result.count) return null

		Object.assign(result, {
			rows: result.rows.map(row =>
				this.formatRow(row.get && !attributes ? row.get() : row),
			),
		})

		if (this.translateFields && l18n) {
			for (const item of result.rows) {
				await this.getL18n(item, l18n)
			}
		}

		if (!filter) return result

		let { count } = result

		const rows = []

		for (const item of result.rows) {
			if (filter(item)) {
				rows.push(item)
			} else {
				count -= 1
			}
		}

		return {
			count,
			rows,
		}
	}
	formatRow(row) {
		const { id, active, createdAt, updatedAt } = row || {}
		const info = {
			id,
			active,
			createdAt,
			updatedAt,
		}

		Object.assign(row, { info })

		return row
	}
	// l18n = [<en>, ...]
	async getL18n(item = {}, l18n = false, locale = false) {
		if (!item.id || !this.translateFields) return item

		const { def, enabled } = locale || this.locale

		const langs = Array.isArray(l18n) ? l18n : [l18n]

		if (langs.length === 1 && langs.find(r => r === def)) return item

		const list = await this.list(
			{
				translateTo: item.id,
				lang: enabled,
			},
			{
				attributes: this.translateFields.concat('lang'),
			},
		)

		this.locale.splitItem(item, this.translateFields)

		if (list) {
			for (const field of list.rows.map(r => r.get())) {
				this.translateFields.forEach(key => {
					const { lang } = field

					item[key].push({
						lang,
						value: field[key],
					})
				})
			}
		}

		if (langs.length === 1) {
			const [lang] = langs
			const _fields = {}

			this.translateFields.forEach(key => {
				const { value } = item[key].find(r => r.lang === lang) || {}

				Object.assign(_fields, {
					[key]: value || item[key].find(r => r.lang === def).value,
				})
			})

			Object.assign(item, { lang }, _fields)
		}

		return item
	}
	async one(
		where = {},
		options = {
			l18n: false,
			attributes: false,
		},
	) {
		const { l18n, attributes } = options
		const query = { where }

		if (attributes) Object.assign(query, { attributes })

		const row = await this.model.findOne(query)

		if (!row) return row

		const item = this.formatRow(row.get())

		if (this.translateFields && l18n) await this.getL18n(item, l18n)

		return item
	}
	async add(data = {}, options = false) {
		const originalData = Object.assign(
			{},
			this.translateFields ? this.locale.splitData(data, true) : data,
		)

		if (data.photo && this.image) {
			const photo = await this.image.base64ToBuffer(data.photo).upload({
				dir: `/${this.table}`,
			})

			Object.assign(originalData, { photo })
		}

		const original = await this.model.create(originalData)
		const id = original.get('id')

		if (this.translateFields) {
			for (const row of this.locale.splitData(data)) {
				await this.model.create(
					Object.assign({}, row, {
						translateTo: id,
					}),
				)
			}
		}

		return this.one({ id }, options)
	}
	async edit(where = false, data = {}, options = false) {
		const originalData = Object.assign(
			{},
			this.translateFields ? this.locale.splitData(data, true) : data,
		)

		const item = await this.one(where, {
			attributes: this.image ? ['id', 'photo'] : ['id'],
		})

		if (!item) throw new Error(this.locale.get(`${this.table}_error_not_found`))

		const { id } = item

		if (this.image && data.photo) {
			if (item.photo) await this.image.unlink([item.photo])

			if (this.image.base64GetMime(data.photo)) {
				const photo = await this.image.base64ToBuffer(data.photo).upload({
					dir: `/${this.table}`,
				})

				Object.assign(originalData, { photo })
			} else {
				Object.assign(originalData, { photo: item.photo })
			}
		}

		if (!(await this.model.update(originalData, { where })))
			throw new Error(this.locale.get(`${this.table}_error_edit`))

		if (this.translateFields) {
			for (const row of this.locale.splitData(data)) {
				await this.model.update(Object.assign({}, row), {
					where: {
						translateTo: id,
						lang: row.lang,
					},
				})
			}
		}

		if (options) return this.one({ id }, options)

		return true
	}
	async remove(_where = {}) {
		const { Op } = this.db.orm
		const attributes = ['id']

		if (this.image) attributes.push('photo')

		const list = await this.list(_where, attributes)

		if (!list || !list.count)
			throw new Error(this.locale.get(`${this.table}_error_not_found`))

		const id = list.rows.map(row => row.get('id'))

		if (
			!(await this.model.destroy({
				where: this.translateFields
					? {
							[Op.or]: {
								id,
								translateTo: id,
							},
							[Op.and]: {
								lang: this.locale.config.active,
							},
					  }
					: { id },
			}))
		)
			throw new Error(this.locale.get(`${this.table}_error_remove`))

		if (this.image)
			await this.image.unlink(list.rows.map(row => row.get('photo')))

		return true
	}
}
