export async function generateImage(
  prompt: string,
  options?: { width?: number; height?: number; style?: string }
): Promise<string> {
  const apiKey = process.env.NANO_BANANA_API_KEY
  const apiUrl = process.env.NANO_BANANA_API_URL

  if (!apiKey || !apiUrl) {
    console.warn('Nano Banana API not configured, skipping image generation')
    return ''
  }

  const response = await fetch(`${apiUrl}/generate`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      prompt,
      width: options?.width ?? 1200,
      height: options?.height ?? 630,
      style: options?.style ?? 'professional',
    }),
  })

  if (!response.ok) {
    console.error(`Nano Banana error: ${response.status}`)
    return ''
  }

  const data = await response.json()
  // Adjust field name based on actual Nano Banana Pro API response
  return (data.imageUrl || data.url || data.image_url || '') as string
}
