require('dotenv').config();
const ngrok = require('@ngrok/ngrok');

(async function() {
		const listener = await ngrok.forward({
				// The port your app is running on.
				addr: 3333,
				authtoken: '3D6YKVvW6NgR6D4WgTN3v_6CywEPo3gBrBQbGA5TYGW',
				// Secure your endpoint with a traffic policy.
				// This could also be a path to a traffic policy file.
				traffic_policy: '{"on_http_request": [{"actions": [{"type": "oauth","config": {"provider": "google"}}]}]}'
		});

		// Output ngrok url to console
		console.log(`Ingress established at ${listener.url()}`);
})();

// Keep the process alive
process.stdin.resume();