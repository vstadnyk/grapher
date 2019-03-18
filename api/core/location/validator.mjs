import Controller from '../../../lib/proto/controller'

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
				country: ['Ukraine'],
				city: ['Lviv']
			} */
		}
	) {
		const { lat, lng, building } = data
		const { whiteList } = options

		if (!lat || !lng) throw this.parent.error('latlng_is_required')

		try {
			const geocoder = await Promise.all(
				this.parent.locale.enabled.map(lang =>
					this.geocoder([lat, lng], lang, whiteList)
				)
			)

			for (const location of geocoder) {
				for (const [field, value] of Object.entries(location)) {
					if (field !== 'lang') {
						if (field === 'building') {
							Object.assign(data, {
								building: building || value || null
							})
						} else {
							const v = {
								lang: location.lang,
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
			}
		} catch (error) {
			throw this.parent.error(error)
		}

		return data
	}
	async geocoder(latlng = [], lang, whiteList = false) {
		const gmap = await this.parent.gmap()
		const geocoder = await gmap.reverseGeocode(latlng, lang)

		if (whiteList) {
			for (const [field, value] of Object.entries(geocoder)) {
				if (whiteList[field] && whiteList[field].indexOf(value) === -1)
					throw this.parent.error(
						`${field}_not_allowed`,
						null,
						200,
						`: ${value}`
					)
			}
		}

		return geocoder
	}
}
