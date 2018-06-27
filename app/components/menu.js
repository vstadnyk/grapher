import Proto from '../../server/__proto'

export default class Menu extends Proto {
	data() {
		return {
			list: [
				{
					link: '/playground',
					name: 'Playground'
				},
				{
					link: '/graphiql',
					name: 'Graphiql'
				},
				{
					link: '/schema',
					name: 'Download schema.json'
				}
			]
		}
	}
}
