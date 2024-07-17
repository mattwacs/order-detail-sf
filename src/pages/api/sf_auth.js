import { authenticateSalesforce } from "@/utils/authenticateSalesforce";

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(400).end()
  }

  try {
    const accessToken = await authenticateSalesforce();
    res.status(200).json({ accessToken })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}