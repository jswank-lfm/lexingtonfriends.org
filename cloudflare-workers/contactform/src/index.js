export default {
	async fetch(request, env, ctx) {
		// Helper function to get allowed CORS origin
		const getAllowedOrigin = () => {
			const allowedOrigins = (env.ORIGIN || '*').split(',').map(o => o.trim());
			const requestOrigin = request.headers.get('Origin');
			return allowedOrigins.includes(requestOrigin) ? requestOrigin : allowedOrigins[0];
		};

		// Handle CORS preflight requests
		if (request.method === 'OPTIONS') {
			return new Response(null, {
				headers: {
					'Access-Control-Allow-Origin': getAllowedOrigin(),
					'Access-Control-Allow-Methods': 'POST, OPTIONS',
					'Access-Control-Allow-Headers': 'Content-Type',
				},
			});
		}

		// Only allow POST requests
		if (request.method !== 'POST') {
			return new Response('Method not allowed', { status: 405 });
		}

		try {
			// Parse form data
			const formData = await request.formData();
			const body = {
				name: formData.get('name'),
				email: formData.get('email'),
				phone: formData.get('phone'),
				subject: formData.get('subject'),
				message: formData.get('message'),
				'g-recaptcha-response': formData.get('g-recaptcha-response'),
			};

			// Validate required fields
			if (!body.name || !body.email || !body.subject || !body.message || !body['g-recaptcha-response']) {
				return new Response('Missing required fields', { 
					status: 400,
					headers: { 'Access-Control-Allow-Origin': getAllowedOrigin() }
				});
			}

			// Verify reCAPTCHA
			console.log('Starting reCAPTCHA validation process:', {
				hasRecaptchaResponse: !!body['g-recaptcha-response'],
				clientIP: request.headers.get('CF-Connecting-IP'),
				hasSecretKey: !!env.RECAPTCHA_KEY,
				userAgent: request.headers.get('User-Agent')
			});
			
			const recaptchaValid = await verifyRecaptcha(body['g-recaptcha-response'], request.headers.get('CF-Connecting-IP'), env.RECAPTCHA_KEY);
			
			console.log('reCAPTCHA validation completed:', { success: recaptchaValid });
			
			if (!recaptchaValid) {
				console.error('reCAPTCHA validation failed - returning error to client');
				return new Response('Unable to validate reCAPTCHA', { 
					status: 400,
					headers: { 'Access-Control-Allow-Origin': getAllowedOrigin() }
				});
			}

			// Send email
			await sendEmail(body, env);

			return new Response('email sent', {
				status: 200,
				headers: { 'Access-Control-Allow-Origin': getAllowedOrigin() }
			});

		} catch (error) {
			console.error('Error processing contact form:', error);
			return new Response('system error sending email', { 
				status: 500,
				headers: { 'Access-Control-Allow-Origin': getAllowedOrigin() }
			});
		}
	},
};

async function verifyRecaptcha(response, remoteip, secretKey) {
	const verifyUrl = 'https://www.google.com/recaptcha/api/siteverify';
	const formData = new FormData();
	formData.append('secret', secretKey);
	formData.append('response', response);
	formData.append('remoteip', remoteip);

	console.log('reCAPTCHA verification started:', {
		responseToken: response ? `${response.substring(0, 20)}...` : 'null',
		remoteip: remoteip,
		secretKeyPresent: !!secretKey,
		verifyUrl: verifyUrl
	});

	try {
		const result = await fetch(verifyUrl, {
			method: 'POST',
			body: formData,
		});

		console.log('reCAPTCHA API response status:', result.status, result.statusText);

		if (!result.ok) {
			console.error('reCAPTCHA API HTTP error:', {
				status: result.status,
				statusText: result.statusText,
				headers: Object.fromEntries(result.headers.entries())
			});
			return false;
		}

		const data = await result.json();
		
		console.log('reCAPTCHA verification response:', {
			success: data.success,
			score: data.score,
			action: data.action,
			challenge_ts: data.challenge_ts,
			hostname: data.hostname,
			'error-codes': data['error-codes']
		});

		if (!data.success && data['error-codes']) {
			console.error('reCAPTCHA validation failed with error codes:', data['error-codes']);
		}

		return data.success;
	} catch (error) {
		console.error('reCAPTCHA verification network/parse error:', {
			message: error.message,
			stack: error.stack,
			name: error.name
		});
		return false;
	}
}

async function sendEmail(formData, env) {
	const auth = btoa(`${env.MAILJET_API_KEY}:${env.MAILJET_API_SECRET}`);
	
	const emailData = {
		Messages: [{
			From: {
				Email: env.MAIL_FROM,
				Name: 'Contact Form'
			},
			To: [{
				Email: env.MAIL_TO,
				Name: 'info@lexingtonfriends.org'
			}],
			Subject: `${env.MAIL_SUBJECT_PREFIX || ''}${formData.subject}`,
			TextPart: `Name: ${formData.name}\nPhone: ${formData.phone || 'Not provided'}\n\n${formData.message}`,
			ReplyTo: {
				Email: formData.email,
				Name: formData.name
			}
		}]
	};

	const response = await fetch('https://api.mailjet.com/v3.1/send', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			'Authorization': `Basic ${auth}`
		},
		body: JSON.stringify(emailData)
	});

	if (!response.ok) {
		const errorData = await response.text();
		console.error('Mailjet API error:', response.status, errorData);
		throw new Error(`Mailjet API error: ${response.status}`);
	}

	const result = await response.json();
	console.log('Email sent successfully:', result);
	return result;
}
