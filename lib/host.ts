const host: string | undefined = 'app.waylo.ai'

let schemeForHttp = 'http://'

if (host === 'app.waylo.ai') {
	schemeForHttp = 'https://'
}

export const apiHost = schemeForHttp + host
