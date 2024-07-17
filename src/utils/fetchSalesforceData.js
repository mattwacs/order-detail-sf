import axios from 'axios'

const instance = axios.create({
  baseURL: 'https://aircompressorservices.my.salesforce.com'
})

export const fetchSalesforceData = async (accessToken, path) => {
  try {
    const response = await instance.get(path, {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    })
    return response.data
  } catch (error) {
    console.error('Error fetching Salesforce data', error)
    throw error;
  }
}