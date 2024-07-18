import axios from 'axios'

export async function authenticateSalesforce() {
  console.log('Authenticating with Salesforce...');
    
  console.log('Environment Variables:');
  console.log('SF_CLIENT_KEY:', process.env.SF_CLIENT_KEY ? 'Loaded' : 'Missing');
  console.log('SF_CLIENT_SECRET:', process.env.SF_CLIENT_SECRET ? 'Loaded' : 'Missing');
  console.log('SF_USERNAME:', process.env.SF_USERNAME ? 'Loaded' : 'Missing');
  console.log('SF_PASSWORD:', process.env.SF_PASSWORD ? 'Loaded' : 'Missing');
  console.log('SF_SECURITY_TOKEN:', process.env.SF_SECURITY_TOKEN ? 'Loaded' : 'Missing');

  const password = `${process.env.SF_PASSWORD}${process.env.SF_SECURITY_TOKEN}`;
  console.log('password string', process.env.SF_PASSWORD);
  console.log('security token', process.env.SF_SECURITY_TOKEN);
  console.log('password', password);
  console.log('username', process.env.SF_USERNAME);

  try {
    const response = await axios.post('https://login.salesforce.com/services/oauth2/token', null, {
      params: {
        grant_type: 'password',
        client_id: process.env.SF_CLIENT_KEY,
        client_secret: process.env.SF_CLIENT_SECRET,
        username: process.env.SF_USERNAME,
        password: password
      }
    })

    return response.data.access_token
  } catch (err) {
    console.error('Salesforce authentication error', err.response.data);
    console.error('Salesforce authentication error:', err.response ? err.response.data : err.message);
    throw new Error('Auth failed', err)
  }
}

