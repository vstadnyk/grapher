import Controller from '../../../proto/controller'

export default class extends Controller {
	constructor(parent) {
		super()

		this.parent = parent
	}
	async data(
		data,
		options = {
			whitelist: false
			/* whitelist: {
				country: ['Jordan'],
				city: ['Amman']
			} */
		}
	) {
		const { lat, lng, building } = data
		const { whiteList } = options

		if (!lat || !lng)
			throw new Error(`${this.parent.table}_error_latlng_is_required`)

		for (const lang of this.parent.locale.enabled) {
			const geocoder = await this.geocoder([lat, lng], lang, whiteList)

			for (const [field, value] of Object.entries(geocoder)) {
				if (field === 'building') {
					Object.assign(data, {
						building: building || value || null
					})
				} else {
					const v = {
						lang,
						value
					}

					if (data[field] && data[field].push) {
						data[field].push(v)
					} else {
						Object.assign(data, {
							[field]: [v]
						})
					}
				}
			}
		}

		return data
	}
	async geocoder(latlng = [], lang, whiteList = false) {
		const geocoder = await this.parent.gmap.reverseGeocode(latlng, lang)

		if (whiteList) {
			for (const [field, value] of Object.entries(geocoder)) {
				if (whiteList[field] && whiteList[field].indexOf(value) === -1)
					throw new Error(
						`${this.locale.get(
							`${this.parent.table}_error_${field}_not_allowed`
						)}: ${value}`
					)
			}
		}

		return geocoder
	}
}
