import geolib from 'geolib'

import { fields, config } from './schema'
import Controller from '../../../lib/proto/controller'

import User from '../../user/controller'
import Config from '../config/controller'
import Gmap from '../../../lib/gmap'

import Validator from './validator'
import Attacher from './attacher'
import Calculator from './calculator'

export default class extends Controller {
	get force() {
		return false
	}
	get table() {
		return 'locations'
	}
	get fields() {
		return fields
	}
	get translateFields() {
		return this.locale.getFields(fields)
	}
	get user() {
		return new User().use(this.db, this.auth, this.locale)
	}
	get geolib() {
		return geolib
	}
	async gmap() {
		const conf = await this.config()

		if (!conf.get('ApiKey')) throw this.error('invalid_ApiKey')
		if (!this._gmap) this._gmap = new Gmap(conf)

		return this._gmap
	}
	get validator() {
		return new Validator(this)
	}
	get attacher() {
		return new Attacher(this)
	}
	get calculator() {
		return new Calculator(this)
	}
	get configDB() {
		return new Config().use(this.db, this.auth, this.locale)
	}
	async config(key = null) {
		this._config = await this.configDB.getOne(this.table)

		if (!this._config) {
			this._config = await this.configDB.insert(
				this.table,
				config,
				'_',
				`Main ${this.table} config`,
				`Main ${this.table} config`
			)
		}

		return key ? this._config.get(key) : this._config
	}
	async location(where, options) {
		const item = await this.one(where, options)

		return item
	}
	async locations(where, options) {
		const list = await this.list(where, options)

		return list
	}
	async modifyLocation(data, options) {
		const { id } = data

		return id
			? this.editLocation(id, data, options)
			: this.addLocation(data, options)
	}
	async addLocation(data, options = false) {
		await this.validator.data(data, options)

		const { id } = await this.add(data, {})

		if (options) {
			const item = await this.one({ id }, options)

			await this.attacher.attach(item, options)

			return item
		}

		return true
	}
	async editLocation(id, data, options) {
		await this.validator.data(data, options)

		await this.edit({ id }, data)

		if (options) {
			const item = await this.one({ id }, options)

			await this.attacher.attach(item, options)

			return item
		}

		return true
	}
	async gmapLocation(
		coord = {},
		{ sendRequest = true, silent = false } = {},
		language = null
	) {
		const data = {
			lat: parseFloat(coord.lat || this.api.ctx.get('appcoordlat')),
			lng: parseFloat(coord.lng || this.api.ctx.get('appcoordlng')),
			lang: language || this.locale.current
		}

		if (Number.isNaN(data.lat) || Number.isNaN(data.lng)) {
			try {
				const { defaultLocation: id = null } = (await this.user.current()) || {}

				if (id) {
					const location =
						(await this.one(
							{ id },
							{
								attributes: ['lat', 'lng']
							}
						)) || {}

					Object.assign(data, location)
				}
			} catch (error) {
				return null
			}
		}

		if (Number.isNaN(data.lat)) {
			if (silent) return null
			throw this.error('lat_not_valid')
		}

		if (Number.isNaN(data.lng)) {
			if (silent) return null
			throw this.error('lng_not_valid')
		}

		if (!sendRequest) return data

		const gmap = await this.gmap()

		const { country = null, city = null, street = null, building = null } =
			(await gmap.reverseGeocode([data.lat, data.lng], data.lang)) || {}

		Object.assign(data, {
			country,
			city,
			street,
			building
		})

		return data
	}
}
