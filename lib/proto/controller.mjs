import Proto from '../__proto'

export default class extends Proto {
	get force() {
		return false
	}
	get model() {
		this.__validate()

		const model = this.db.model(this.table, this.fields)

		model.sync({
			force: this.force
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
			attributes: false
		}
	) {
		const { l18n, filter, attributes } = options
		const { Op } = this.db.orm

		const query = {
			order: [],
			offset: 0,
			where
		}

		if (attributes && attributes.length) Object.assign(query, { attributes })

		if (query.where.params) {
			const { params } = query.where
			const { order, limit, offset, search } = params

			delete query.where.params

			if (order) query.order.push([order.column || 'id', order.sort || 'DESC'])

			if (search && search.column) {
				for (const [key, value] of Object.entries(search)) {
					if (typeof value === 'string') {
						Object.assign(where, {
							[search.column]: {
								[Op[key]]: value
							}
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
									[Op[key]]: value
								}
							})
						}

						Object.assign(where, {
							[Op.or]: or
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
					lang: this.locale.def
				})
			})

		const result = await this.model.findAndCountAll(query)

		if (!result || !result.count) return null

		Object.assign(result, {
			rows: result.rows.map(row =>
				this.formatRow(row.get && !attributes ? row.get() : row)
			)
		})

		if (this.translateFields && l18n) {
			await Promise.all(result.rows.map(row => this.getL18n(row, l18n)))
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
			rows
		}
	}
	formatRow(row) {
		const { id, active, createdAt, updatedAt } = row || {}

		if (!id) return row

		const info = {
			id,
			active,
			createdAt,
			updatedAt,
			createdAtString: this.moment(createdAt).format('YYYY-MM-DD HH:mm:ss'),
			updatedAtString: this.moment(updatedAt).format('YYYY-MM-DD HH:mm:ss')
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
				lang: enabled
			},
			{
				attributes: this.translateFields.concat('lang')
			}
		)

		this.locale.splitItem(item, this.translateFields)

		if (list) {
			for (const field of list.rows.map(r => r.get())) {
				this.translateFields.forEach(key => {
					const { lang } = field

					item[key].push({
						lang,
						value: field[key]
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
					[key]: value || item[key].find(r => r.lang === def).value
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
			attributes: false
		}
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
			this.translateFields ? this.locale.splitData(data, true) : data
		)

		if (this.image) {
			// const images = await this.uploadImages(data)
			const images = await this.uploadImagesNew(data)

			images.forEach(({ field, src }) =>
				Object.assign(originalData, { [field]: src })
			)
		}

		const original = await this.model.create(originalData)

		const id = original.get('id')

		if (this.translateFields) {
			await Promise.all(
				this.locale.splitData(data).map(row =>
					this.model.create(
						Object.assign({}, row, {
							translateTo: id
						})
					)
				)
			)
		}

		if (!options) return true

		const item = await this.one({ id }, options)

		return item
	}
	async edit(where = {}, data = {}, options = false) {
		const originalData = Object.assign(
			{},
			this.translateFields ? this.locale.splitData(data, true) : data
		)
		const attributes = this.image
			? this.locale.getFields(this.fields, 'image')
			: []

		attributes.push('id')

		const item = await this.one(where, {
			attributes
		})

		if (!item) throw this.error('not_found')

		const { id } = item

		this.locale.getFields(this.fields, 'image').forEach(field => {
			if (originalData[field] && originalData[field].includes(item[field]))
				delete originalData[field]

			if (originalData[field] === '')
				Object.assign(originalData, { [field]: null })
		})

		const imageFields = Object.keys(originalData)
			.map(row =>
				this.locale
					.getFields(this.fields, 'image')
					.find(
						r =>
							r === row &&
							originalData[r] &&
							this.image.base64GetMime(originalData[r])
					)
			)
			.filter(row => row)

		if (imageFields.length) {
			await Promise.all(
				imageFields
					.map(field => (item[field] ? this.image.unlink(item[field]) : null))
					.filter(row => row)
			)

			const uploadImages = await Promise.all(
				imageFields.map(field =>
					this.image.base64ToBuffer(data[field]).upload({
						dir: `/${this.table}`,
						filename: `${this.table}_${field}_${new Date().valueOf()}`
					})
				)
			)

			uploadImages.forEach((src, i) => {
				Object.assign(originalData, { [imageFields[i]]: src })
			})
		}

		await Promise.all(
			this.locale
				.getFields(this.fields, 'image')
				.map(field =>
					originalData[field] === null ? this.image.unlink(item[field]) : false
				)
				.filter(row => row)
		)

		try {
			await this.model.update(originalData, { where })
		} catch (error) {
			console.log(error)

			throw this.error('edit')
		}

		if (this.translateFields) {
			await Promise.all(
				this.locale.splitData(data).map(row =>
					this.model.update(Object.assign({}, row), {
						where: {
							translateTo: id,
							lang: row.lang
						}
					})
				)
			)
		}

		if (options) return this.one({ id }, options)

		return true
	}
	async remove(_where = {}, throwErrors = true) {
		const { Op } = this.db.orm
		const attributes = this.image
			? this.locale.getFields(this.fields, 'image')
			: []

		attributes.push('id')

		const list = await this.list(_where, { attributes })

		if (!throwErrors && !list) return null
		if (throwErrors && !list) throw this.error('not_found')

		if (this.image)
			await Promise.all(list.rows.map(row => this.unlinkImage(row.get())))

		const id = list.rows.map(row => row.get('id'))

		if (
			!(await this.model.destroy({
				where: this.translateFields
					? {
							[Op.or]: {
								id,
								translateTo: id
							},
							[Op.and]: {
								lang: this.locale.config.active
							}
					  }
					: { id }
			}))
		) {
			if (!throwErrors) return null
			throw this.error('remove')
		}

		return true
	}
	async uploadImagesNew(data) {
		const fields = this.locale
			.getFields(this.fields, 'image')
			.filter(field => data[field] && this.image.base64GetMime(data[field]))

		const upload = await Promise.all(
			fields.map(field =>
				this.image.base64ToBuffer(data[field]).upload({
					dir: `/${this.table}`,
					filename: `${this.table}_${field}_${new Date().valueOf()}`
				})
			)
		)

		const result = upload
			.filter((a, i) => a && fields[i])
			.map((src, i) => ({
				src,
				field: fields[i]
			}))

		return result
	}
	async uploadImages(data) {
		return Promise.all(
			this.locale
				.getFields(this.fields, 'image')
				.filter(field => data[field])
				.map(async field => ({
					field,
					src: this.image.base64GetMime(data[field])
						? await this.image.base64ToBuffer(data[field]).upload({
								dir: `/${this.table}`,
								filename: `${this.table}_${field}_${new Date().valueOf()}`
						  })
						: data[field]
				}))
		)
	}
	async unlinkImage(item) {
		return Promise.all(
			this.locale
				.getFields(this.fields, 'image')
				.filter(field => item[field])
				.map(field => this.image.unlink(item[field]))
		)
	}
	error(key = '', type = null, status, text = '', dump = null) {
		const error = new Error(
			this.locale
				.get(`${this.table || ''}_error_${key}`)
				.concat(
					typeof text === 'object' ? ' '.concat(JSON.stringify(text)) : text
				)
		)

		Object.assign(error, {
			dump,
			type:
				type ||
				this.table
					.concat('_', key)
					.toUpperCase()
					.replace(/-/gi, '_'),
			status
		})

		return error
	}
}
