import Gmap from '@google/maps'

export default class {
	constructor(config = {}) {
		this.config = config
	}
	get engine() {
		return Gmap
	}
	client(language = 'en') {
		const key = this.config.get('ApiKey')

		return this.engine.createClient({
			key,
			Promise,
			language
		})
	}
	validate({ status } = {}) {
		if (status !== 200) throw this.error('Responce', `Status ${status}`)
	}
	async reverseGeocode(latlng = [], lang) {
		const location = { lang }
		const { types } = this.config.get('reverseGeocode') || {}

		try {
			const request = await this.client(lang)
				.reverseGeocode({ latlng })
				.asPromise()

			this.validate(request)

			for (const row of request.json.results) {
				for (const [field, typesArray] of Object.entries(types)) {
					typesArray.forEach(key => {
						const value = [
							...new Set(
								row.address_components
									.filter(r => r.types.indexOf(key) !== -1)
									.map(r => r.long_name)
									.filter(r => r)
							)
						].find(r => r)

						if (!location[field] && value)
							Object.assign(location, {
								[field]: value
							})
					})
				}
			}
		} catch (error) {
			throw this.error('Reverse Geocode', JSON.stringify(error))
		}

		return location
	}
	async distanceMatrix(
		origins = [],
		destinations = [],
		lang = null,
		raw = false,
		units = 'metric'
	) {
		try {
			const request = await this.client(lang)
				.distanceMatrix({ origins, destinations, units })
				.asPromise()

			this.validate(request)

			if (raw) return request.json

			return request.json.rows.map(
				({ elements: row = [] } = {}) =>
					row.find(r => r.distance).distance || {}
			)
		} catch (error) {
			const { json: { error_message = null } = {} } = error || {}

			throw this.error('Distance Matrix', error_message || error)
		}
	}
	error(type = '', message = '') {
		return new Error(`Google API ${type} error: ${message}`)
	}
}
