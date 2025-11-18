# Cloudflare Worker Deployment Guide

## Setup Instructions

### 1. Create a Cloudflare Worker

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Navigate to **Workers & Pages** in the left sidebar
3. Click **Create Application** → **Create Worker**
4. Name your worker (e.g., `loreal-routine-api`)
5. Click **Deploy**

### 2. Upload Worker Code

1. In your worker dashboard, click **Edit Code**
2. Replace the default code with the contents of `worker.js`
3. Click **Save and Deploy**

### 3. Set Environment Variables

1. In your worker dashboard, go to **Settings** → **Variables**
2. Add a new environment variable:
   - **Variable name**: `OPENAI_API_KEY`
   - **Value**: Your OpenAI API key (starts with sk-proj- or sk-)
   - Click **Encrypt** to secure the key
3. Click **Save**

### 4. Get Your Worker URL

After deployment, you'll get a URL like:
```
https://loreal-routine-api.your-subdomain.workers.dev
```

### 5. Update Your Frontend Code

Replace the `WORKER_URL` in your `script.js` file with your actual worker URL.

## Security Notes

- The worker validates all incoming requests
- API keys are stored securely as encrypted environment variables
- CORS headers are properly configured
- Rate limiting can be added if needed

## Testing Your Worker

You can test your worker using curl:

```bash
curl -X POST "https://your-worker-url.workers.dev" \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      {"role": "user", "content": "Hello, test message"}
    ],
    "max_tokens": 100
  }'
```

## Troubleshooting

- **500 Error**: Check your OpenAI API key is correctly set
- **CORS Error**: Ensure your domain is allowed (or use * for testing)
- **Rate Limits**: OpenAI has usage limits - check your account status