import axios from 'axios'

export async function authenticateSalesforce() {
  try {
    const response = await axios.post('https://login.salesforce.com/services/oauth2/token', null, {
      params: {
        grant_type: 'password',
        client_id: process.env.SF_CLIENT_KEY,
        client_secret: process.env.SF_CLIENT_SECRET,
        username: process.env.SF_USERNAME,
        password: `${process.env.SF_PASSWORD}${process.env.SF_SECURITY_TOKEN}`
      }
    })

    return response.data.access_token
  } catch (error) {
    console.error('Salesforce authentication error:', error.response.data)
    throw new Error('Authentication failed')
  }
}