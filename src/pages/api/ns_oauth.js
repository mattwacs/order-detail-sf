import crypto from 'crypto';
import axios from 'axios';
import Oauth from 'oauth-1.0a';

const oauth = Oauth({
  consumer: {
    key: process.env.CLIENT_ID,
    secret: process.env.CLIENT_SECRET,
  },
  signature_method: 'HMAC-SHA256',
  hash_function(base_string, key) {
    return crypto.createHmac('sha256', key).update(base_string).digest('base64');
  },
  realm: process.env.ACCOUNT_ID,
});

export default async function handler(req, res) {
  const { query } = req;

  const apiUrl = `https://${process.env.ACCOUNT_ID}.restlets.api.netsuite.com/app/site/hosting/restlet.nl?script=${process.env.SCRIPT_ID}&deploy=${process.env.SCRIPT_DEPLOYMENT_ID}&item_ids=${query.item_ids}`;

  const requestData = {
    url: apiUrl,
    method: 'GET',
  };

  const token = {
    key: process.env.TOKEN_ID,
    secret: process.env.TOKEN_SECRET,
  };
  
  try {
    const response = await axios({
      method: requestData.method,
      url: requestData.url,
      headers: {
        ...oauth.toHeader(oauth.authorize(requestData, token)),
        'Content-Type': 'application/json',
      } 
    });

    if (response.status === 200) {
      res.status(200).json(response.data);
    } else {
      res.status(response.status).json({ error: `Failed to get data from Netsuite: ${response.message}` });
    }
  } catch (err) {
    res.status(500).json({ error: `Failed to get data from Netsuite: ${err.message}` });
  }
}