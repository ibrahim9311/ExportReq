# reCAPTCHA Setup Guide

## Issue: "Invalid key type" Error

If you're seeing the error **"ERROR for site owner: Invalid key type"**, this means your reCAPTCHA keys don't match the implementation type.

## Current Implementation

This project uses **reCAPTCHA v2 Checkbox** (the "I'm not a robot" checkbox widget).

The library used: `react-google-recaptcha@3.1.0`

## How to Fix

### Option 1: Create New reCAPTCHA v2 Checkbox Keys (Recommended)

1. Go to [Google reCAPTCHA Admin Console](https://www.google.com/recaptcha/admin)

2. Click the **"+"** button to register a new site

3. Fill in the registration form:
   - **Label**: Give your site a name (e.g., "My App - Production")
   - **reCAPTCHA type**: Select **"reCAPTCHA v2"**
   - **Type**: Choose **"I'm not a robot" Checkbox** ⚠️ (NOT Invisible)
   - **Domains**: Add your domain(s)
     - For development: `localhost`
     - For production: `your-domain.com`
   - Accept the terms and submit

4. Copy the **Site Key** (not the Secret Key)

5. Add it to your `.env` file:
   ```
   VITE_RECAPTCHA_SITE_KEY=your_new_site_key_here
   ```

6. Restart your development server

### Option 2: Change Implementation to Match Your Keys

If you want to keep your current keys, you need to update the implementation to match the key type.

#### For reCAPTCHA v2 Invisible:

Update `SignupPage.tsx`:
```tsx
<ReCAPTCHA
  ref={recaptchaRef}
  sitekey={RECAPTCHA_SITE_KEY}
  size="invisible"  // Add this line
  onChange={handleRecaptchaChange}
  onExpired={() => setRecaptchaToken(null)}
  onErrored={() => {
    setRecaptchaToken(null);
    toast({
      variant: 'destructive',
      title: 'خطأ في reCAPTCHA',
      description: 'فشل تحميل reCAPTCHA. يرجى تحديث الصفحة والمحاولة مرة أخرى.'
    });
  }}
/>
```

Then trigger it programmatically before form submission.

#### For reCAPTCHA v3:

You'll need to completely change the implementation:

1. Remove `react-google-recaptcha` dependency:
   ```bash
   npm uninstall react-google-recaptcha @types/react-google-recaptcha
   ```

2. Install v3 client:
   ```bash
   npm install react-google-recaptcha-v3
   ```

3. Update the implementation (significant code changes required)

## Identifying Your Key Type

To check what type your current keys are:

1. Go to [Google reCAPTCHA Admin Console](https://www.google.com/recaptcha/admin)
2. Find your site in the list
3. Click "Settings" (gear icon)
4. Check the "reCAPTCHA type" field

## Current Keys (From Error)

- Site Key: `6LfOiuUrAAAAAGsNyqsNSb5PPXGiBKROd9PTnW6G`
- (Second key): `6LfOiuUrAAAAAO9mRcX77q4g7mlnzvoxkKS0Xley`

**Recommendation**: Create new v2 Checkbox keys following Option 1 above.

## Testing

After updating your keys:

1. Clear browser cache
2. Restart development server
3. Open the signup page
4. You should see the "I'm not a robot" checkbox widget
5. Click it to verify it works without errors

## Common Issues

### Issue: Widget not showing
- **Cause**: Invalid site key or network issues
- **Solution**: Verify the site key is correct and check browser console

### Issue: "Invalid domain" error
- **Cause**: Domain not whitelisted in reCAPTCHA admin
- **Solution**: Add your domain to the allowed domains list

### Issue: Keys work in dev but not production
- **Cause**: Production domain not added to allowed domains
- **Solution**: Add production domain to reCAPTCHA admin settings

## Support

If you continue to experience issues:
1. Verify you're using v2 Checkbox keys
2. Check browser console for detailed error messages
3. Ensure your domain is correctly configured in reCAPTCHA admin
