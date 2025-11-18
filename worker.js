/**
 * Cloudflare Worker for L'Oréal Routine Builder
 * Handles OpenAI API requests to avoid CORS issues
 */

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

async function handleRequest(request) {
  // Handle CORS preflight requests
  if (request.method === 'OPTIONS') {
    return handleCORS()
  }

  // Only allow POST requests to our API endpoint
  if (request.method !== 'POST') {
    return new Response('Method not allowed', { 
      status: 405,
      headers: getCORSHeaders()
    })
  }

  try {
    // Parse the request body
    const requestData = await request.json()
    
    // Validate required fields
    if (!requestData.messages || !Array.isArray(requestData.messages)) {
      return new Response(JSON.stringify({ 
        error: 'Invalid request: messages array is required' 
      }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          ...getCORSHeaders()
        }
      })
    }

    // Prepare the request to OpenAI API
    const openAIRequest = {
      model: requestData.model || 'gpt-4o',
      messages: requestData.messages,
      max_tokens: requestData.max_tokens || 500,
      temperature: requestData.temperature || 0.7
    }

    // Make request to OpenAI API
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`, // Set this as an environment variable in Cloudflare
      },
      body: JSON.stringify(openAIRequest)
    })

    // Handle OpenAI API response
    if (!response.ok) {
      const errorData = await response.text()
      console.error('OpenAI API Error:', errorData)
      
      return new Response(JSON.stringify({
        error: `OpenAI API Error: ${response.status}`,
        details: errorData
      }), {
        status: response.status,
        headers: {
          'Content-Type': 'application/json',
          ...getCORSHeaders()
        }
      })
    }

    // Parse and return the successful response
    const data = await response.json()
    
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        ...getCORSHeaders()
      }
    })

  } catch (error) {
    console.error('Worker Error:', error)
    
    return new Response(JSON.stringify({
      error: 'Internal server error',
      message: error.message
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        ...getCORSHeaders()
      }
    })
  }
}

// Handle CORS preflight requests
function handleCORS() {
  return new Response(null, {
    status: 200,
    headers: getCORSHeaders()
  })
}

// Get CORS headers
function getCORSHeaders() {
  return {
    'Access-Control-Allow-Origin': '*', // In production, replace with your domain
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400', // 24 hours
  }
}