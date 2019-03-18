module.exports = {
	apps: [
		{
			name: 'grapher',
			script: './server/index.js',
			autorestart: true,
			env: {
				NODE_ENV: 'development',
				PORTS: '[3000,3443]'
			},
			node_args: '-r esm',
			max_memory_restart: '4096M',
			// max_restarts: 3,
			// restart_delay: 3000,
			// min_uptime: 3000,
			// watch: false,
			error_file: 'static/log/pm2/error.log',
			out_file: 'static/log/pm2/output.log'
		}
	]
}
