import { fetchSalesforceData } from "@/utils/fetchSalesforceData";
import axios from "axios";

export default async function handler(req, res) {
  const { query, headers } = req;

  const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';
  const host = headers.host;

  try {
    const authResponse = await axios.post(`${protocol}://${host}/api/sf_auth`, {});
    const accessToken = authResponse.data.accessToken;

    console.log('access token', accessToken);
    if (!accessToken) {
      return res.status(500).json({ error: 'Failed to authenticate with Salesforce' });
    }

    const orderQuery = `
      SELECT Id,
        (SELECT Id, Product2Id, Product2.Parent_Part_Netsuite_ID__c, Product2.Name, Product2.Description FROM OrderItems)
      FROM Order
      WHERE Id = '${query.order_id}'
    `
    const orderPath = `/services/data/v52.0/query?q=${encodeURIComponent(orderQuery)}`;

    const orderData = await fetchSalesforceData(accessToken, orderPath);

    if (!orderData.records.length) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.status(200).json(orderData.records[0]);
  } catch (err) {
    res.status(500).json({ error: `Failed to get data from Salesforce: ${err.message}` });
  }
}