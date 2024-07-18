// import axios from 'axios'

// export async function authenticateSalesforce() {
//   try {
//     const response = await axios.post('https://login.salesforce.com/services/oauth2/token', null, {
//       params: {
//         grant_type: 'password',
//         client_id: process.env.SF_CLIENT_KEY,
//         client_secret: process.env.SF_CLIENT_SECRET,
//         username: process.env.SF_USERNAME,
//         password: `${process.env.SF_PASSWORD}${process.env.SF_SECURITY_TOKEN}`
//       }
//     })

//     return response.data.access_token
//   } catch (error) {
//     console.error('Salesforce authentication error:', error.response.data)
//     throw new Error('Authentication failed')
//   }
// }

import axios from 'axios';

export async function authenticateSalesforce() {
  try {
    console.log('Environment Variables:');
    console.log('SF_CLIENT_KEY:', process.env.SF_CLIENT_KEY ? 'Loaded' : 'Missing');
    console.log('SF_CLIENT_SECRET:', process.env.SF_CLIENT_SECRET ? 'Loaded' : 'Missing');
    console.log('SF_USERNAME:', process.env.SF_USERNAME ? 'Loaded' : 'Missing');
    console.log('SF_PASSWORD:', process.env.SF_PASSWORD ? 'Loaded' : 'Missing');
    console.log('SF_SECURITY_TOKEN:', process.env.SF_SECURITY_TOKEN ? 'Loaded' : 'Missing');

    const response = await axios.post('https://login.salesforce.com/services/oauth2/token', null, {
      params: {
        grant_type: 'password',
        client_id: process.env.SF_CLIENT_KEY,
        client_secret: process.env.SF_CLIENT_SECRET,
        username: process.env.SF_USERNAME,
        password: `${process.env.SF_PASSWORD}${process.env.SF_SECURITY_TOKEN}`
      }
    });

    console.log('Salesforce authentication successful');
    return response.data.access_token;
  } catch (error) {
    console.error('Salesforce authentication error:', error.response ? error.response.data : error.message);
    throw new Error('Authentication failed');
  }
}
