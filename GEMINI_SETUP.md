# Gemini API Setup Guide

## Overview
This application uses Google's Gemini AI to generate skill tests for freelancer registration. To enable this feature, you need to configure a Gemini API key.

## Getting Your Gemini API Key

1. **Visit Google AI Studio**
   - Go to: https://aistudio.google.com/app/apikey

2. **Sign in with your Google Account**
   - Use any Google account (personal or workspace)

3. **Create an API Key**
   - Click "Create API Key"
   - Select or create a Google Cloud project
   - Copy the generated API key

4. **Add the API Key to Your Environment**
   - Open `server/.env` file
   - Find the line: `GEMINI_API_KEY=`
   - Paste your API key after the equals sign:
     ```
     GEMINI_API_KEY=AIzaSyBdMBhebWaaR4JKd-P0R00BTCkZoJ7PNYc
     ```

5. **Restart the Server**
   - Stop the server (Ctrl+C)
   - Run `npm run dev` again

## Troubleshooting

### "Failed to generate test" Error

If you see this error during freelancer registration:

1. **Check if API key is configured**
   - Open `server/.env`
   - Verify `GEMINI_API_KEY` has a value

2. **Check server logs**
   - Look for error messages in the terminal running the server
   - Common errors:
     - `❌ GEMINI_API_KEY is not configured` - Add your API key
     - `❌ Gemini API authentication failed` - Check if your API key is valid
     - `API quota exceeded` - You've hit the free tier limit

3. **Verify API key is valid**
   - Go back to https://aistudio.google.com/app/apikey
   - Check if the key is still active
   - Create a new key if needed

4. **Check browser console**
   - Open browser DevTools (F12)
   - Look for error messages in the Console tab
   - Check Network tab for failed API requests

### Free Tier Limits

Gemini API has a free tier with limits:
- 15 requests per minute
- 1,500 requests per day
- 1 million tokens per day

If you exceed these limits, you'll need to:
- Wait for the quota to reset
- Upgrade to a paid plan
- Use a different API key

## Fallback Behavior

If Gemini API is not configured or fails:
- The system will use a generic fallback test
- Users can still complete registration
- The test will be less detailed but functional

## Security Notes

⚠️ **Important Security Practices:**

1. **Never commit `.env` file to git**
   - It's already in `.gitignore`
   - Keep your API keys secret

2. **Use different keys for development and production**
   - Create separate projects in Google Cloud
   - Use environment-specific keys

3. **Rotate keys regularly**
   - Generate new keys periodically
   - Delete old unused keys

4. **Monitor usage**
   - Check your usage at: https://aistudio.google.com/app/apikey
   - Set up alerts for unusual activity

## Production Deployment

For production (e.g., Vercel, Railway, Render):

1. **Add environment variable in your hosting platform**
   - Don't use the `.env` file
   - Use the platform's environment variable settings

2. **Example for Vercel:**
   - Go to Project Settings → Environment Variables
   - Add: `GEMINI_API_KEY` = `your-api-key`
   - Redeploy your application

3. **Example for Railway:**
   - Go to Variables tab
   - Add: `GEMINI_API_KEY` = `your-api-key`
   - Railway will auto-redeploy

## Need Help?

- Gemini API Documentation: https://ai.google.dev/docs
- Google AI Studio: https://aistudio.google.com
- API Key Management: https://aistudio.google.com/app/apikey
