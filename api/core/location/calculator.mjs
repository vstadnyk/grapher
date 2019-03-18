import Controller from '../../../lib/proto/controller'

export default class extends Controller {
	constructor(parent) {
		super()

		this.parent = parent
		this._config = null
	}
	async config(key = null) {
		const config = await this.parent.config('calculator')

		return config[key] || config
	}
	async distanceOneToOne(to = {}, coord = {}, silent = false) {
		const { useGeoLib = true, useGoogle = false } =
			(await this.config('distance')) || {}

		const from = await this.parent.gmapLocation(coord, {
			sendRequest: false,
			silent: true
		})

		if (!from) return 0

		if (useGeoLib && !useGoogle) {
			try {
				return this.parent.geolib.getDistance(
					{ latitude: from.lat, longitude: from.lng },
					{ latitude: to.lat, longitude: to.lng }
				)
			} catch (error) {
				if (!silent) throw error
				return 0
			}
		}

		if (useGoogle && !useGeoLib) {
			try {
				const gmap = await this.parent.gmap()

				const gm =
					(await gmap.distanceMatrix(
						[`${from.lat}, ${from.lng}`],
						[`${to.lat}, ${to.lng}`],
						this.parent.locale.current
					)) || []

				return gm.map(({ value }) => value).find(r => r)
			} catch (error) {
				if (!silent) throw error
				return 0
			}
		}

		return 0
	}
	async distanceOneToMany(
		list = [],
		find = () => ({}),
		coord = {},
		silent = false
	) {
		const { useGeoLib = true, useGoogle = false } =
			(await this.config('distance')) || {}

		const from = await this.parent.gmapLocation(coord, {
			sendRequest: false,
			silent: true
		})

		if (!from) return list

		if (useGeoLib && !useGoogle) {
			return list.map(item => {
				const to = find(item)

				try {
					return Object.assign({}, item, {
						distance:
							to && to.lat && to.lng
								? this.parent.geolib.getDistance(
										{ latitude: from.lat, longitude: from.lng },
										{ latitude: to.lat, longitude: to.lng }
								  )
								: 0
					})
				} catch (error) {
					if (!silent) throw error

					return Object.assign({}, item, { distance: 0 })
				}
			})
		}

		if (useGoogle && !useGeoLib) {
			const to = list
				.map(item => {
					const { lat = null, lng = null } = find(item) || {}

					return lat && lng ? `${lat}, ${lng}` : null
				})
				.filter(r => r)

			try {
				const gmap = await this.parent.gmap()

				const gm =
					(await gmap.distanceMatrix(
						[`${from.lat}, ${from.lng}`],
						to,
						this.parent.locale.current,
						true
					)) || []

				const { elements = [] } = gm.rows.find(r => r.elements) || {}

				const result = elements.map((row, i) => {
					const { distance: { value: distance } = {} } = row || {}
					const c = to[i].split(', ').map(r => parseFloat(r))

					return { distance, lat: c[0], lng: c[1] }
				})

				return list.map(item => {
					const { lat = null, lng = null } = find(item) || {}

					const { distance = 0 } =
						result.find(row => row.lat === lat && row.lng === lng) || {}

					return Object.assign({}, item, { distance })
				})
			} catch (error) {
				if (!silent) throw error
				return 0
			}
		}

		return list
	}
	distanceToString(distance = 0) {
		if (Number.isNaN(distance)) return distance

		if (distance >= 1000)
			return (distance / 1000)
				.toFixed(2)
				.concat(' ', this.parent.locale.get('km'))

		if (distance < 1000)
			return distance.toString().concat(' ', this.parent.locale.get('m'))

		return ''
	}
}
