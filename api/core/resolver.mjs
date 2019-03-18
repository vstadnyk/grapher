import Proto from '../../lib/proto/resolver'

import { schema, scalars } from './schema'

export default class extends Proto {
	constructor() {
		super(schema, scalars)
	}
	subscribe(pubsub) {
		return {
			onTest: {
				subscribe: () => pubsub.asyncIterator('Test')
			}
		}
	}
	test() {
		return '😃 it works!'
	}
	_test(_, { text }, { pubsub }) {
		const _text = text || '🤪 empty string'

		pubsub.publish('Test', {
			onTest: _text
		})

		return _text
	}
}
