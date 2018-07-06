import Gmap from '@google/maps'

import { locales, gmap as config } from '../config'

const { ApiKey, types } = config

export default class {
	get config() {
		return config
	}
	get engine() {
		return Gmap
	}
	client(lang) {
		return this.engine.createClient({
			key: ApiKey,
			Promise,
			language: lang || locales.default,
		})
	}
	async validate(location) {
		const { status } = location

		if (status !== 200) throw new Error(`Gmap error: Responce status ${status}`)

		return true
	}
	async reverseGeocode(latlng = [], lang) {
		const location = {}

		try {
			const request = await this.client(lang)
				.reverseGeocode({ latlng })
				.asPromise()

			await this.validate(request)

			for (const row of request.json.results) {
				for (const [field, typesArray] of Object.entries(types)) {
					typesArray.forEach(key => {
						const value = [
							...new Set(
								row.address_components
									.filter(r => r.types.indexOf(key) !== -1)
									.map(r => r.long_name)
									.filter(r => r),
							),
						].find(r => r)

						if (!location[field] && value)
							Object.assign(location, {
								[field]: value,
							})
					})
				}
			}
		} catch (error) {
			throw new Error(JSON.stringify(error))
		}

		return location
	}
}
