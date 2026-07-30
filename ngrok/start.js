require('dotenv').config();
const ngrok = require('@ngrok/ngrok');

const DEFAULT_PORT = 3333;
const DEFAULT_NAME = 'stencil-lib';
const DEFAULT_TRAFFIC_POLICY = '{"on_http_request": [{"actions": [{"type": "oauth","config": {"provider": "google"}}]}]}';
const LEGACY_AUTHTOKEN = '3D6YKVvW6NgR6D4WgTN3v_6CywEPo3gBrBQbGA5TYGW';

function getArgValue(name) {
	const prefix = `--${name}=`;
	const found = process.argv.find((arg) => arg.startsWith(prefix));
	return found ? found.slice(prefix.length) : undefined;
}

function toPortNumber(value) {
	if (!value) {
		return DEFAULT_PORT;
	}

	const parsed = Number.parseInt(value, 10);
	if (Number.isNaN(parsed) || parsed <= 0) {
		throw new Error(`Invalid port "${value}". Use a positive integer.`);
	}

	return parsed;
}

(async function start() {
	try {
		const port = toPortNumber(getArgValue('port') || process.env.NGROK_PORT);
		const name = getArgValue('name') || process.env.NGROK_NAME || DEFAULT_NAME;
		const trafficPolicy = getArgValue('traffic-policy') || process.env.NGROK_TRAFFIC_POLICY || DEFAULT_TRAFFIC_POLICY;
		const authtoken = process.env.NGROK_AUTHTOKEN || LEGACY_AUTHTOKEN;

		const listener = await ngrok.forward({
			addr: port,
			authtoken,
			traffic_policy: trafficPolicy
		});

		console.log(`ngrok target: ${name}`);
		console.log(`ngrok local: http://localhost:${port}`);
		console.log(`Ingress established at ${listener.url()}`);

		process.on('SIGINT', async () => {
			await listener.close();
			process.exit(0);
		});

		// Keep the process alive
		process.stdin.resume();
	} catch (error) {
		console.error(`Failed to start ngrok: ${error.message}`);
		process.exit(1);
	}
})();