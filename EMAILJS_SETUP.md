# EmailJS Setup for MentorBridge Mentor Approval Emails

## Step 1 — Create free account
Go to https://www.emailjs.com → Sign Up

## Step 2 — Add Email Service
1. Dashboard → Email Services → Add New Service
2. Choose Gmail (or any email provider)
3. Connect your email account
4. Service ID: use `mentorbridge_service`
5. Save

## Step 3 — Create Approval Email Template
1. Dashboard → Email Templates → Create New Template
2. Template ID: `mentor_approved`
3. Fill in:

**Subject:**
```
✅ Your MentorBridge Mentor Application has been Approved!
```

**Body (HTML):**
```html
<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;">
  <div style="background:#7A286F;padding:30px;border-radius:12px 12px 0 0;text-align:center;">
    <h1 style="color:#fff;margin:0;font-size:24px;">MentorBridge</h1>
    <p style="color:rgba(255,255,255,0.8);margin:8px 0 0;">Mentor Application Decision</p>
  </div>
  <div style="background:#fff;border:1px solid #E5E0E5;border-top:none;padding:30px;border-radius:0 0 12px 12px;">
    <h2 style="color:#1E001B;margin:0 0 16px;">🎉 Congratulations, {{to_name}}!</h2>
    <p style="color:#555;line-height:1.7;">Your application to become a mentor on MentorBridge has been <strong style="color:#22A06B;">approved</strong>.</p>
    <p style="color:#555;line-height:1.7;">You can now sign in to your mentor dashboard and start connecting with mentees who need your guidance.</p>
    <div style="text-align:center;margin:30px 0;">
      <a href="{{signin_link}}" style="background:#7A286F;color:#fff;padding:14px 32px;border-radius:10px;text-decoration:none;font-weight:bold;font-size:16px;display:inline-block;">
        Sign in to Mentor Dashboard →
      </a>
    </div>
    <p style="color:#9C97A0;font-size:13px;">If the button doesn't work, copy and paste this link: {{signin_link}}</p>
    <hr style="border:none;border-top:1px solid #E5E0E5;margin:24px 0;">
    <p style="color:#9C97A0;font-size:12px;text-align:center;">MentorBridge — Connecting people with the right mentors</p>
  </div>
</div>
```

**To Email:** `{{to_email}}`
**To Name:** `{{to_name}}`
**Reply To:** your admin email

---

## Step 4 — Create Decline Email Template
1. Dashboard → Email Templates → Create New Template
2. Template ID: `mentor_declined`
3. Fill in:

**Subject:**
```
Update on your MentorBridge Mentor Application
```

**Body (HTML):**
```html
<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;">
  <div style="background:#7A286F;padding:30px;border-radius:12px 12px 0 0;text-align:center;">
    <h1 style="color:#fff;margin:0;font-size:24px;">MentorBridge</h1>
    <p style="color:rgba(255,255,255,0.8);margin:8px 0 0;">Mentor Application Decision</p>
  </div>
  <div style="background:#fff;border:1px solid #E5E0E5;border-top:none;padding:30px;border-radius:0 0 12px 12px;">
    <h2 style="color:#1E001B;margin:0 0 16px;">Thank you for applying, {{to_name}}</h2>
    <p style="color:#555;line-height:1.7;">We appreciate your interest in becoming a mentor on MentorBridge. After carefully reviewing your application, we are unable to approve your mentor account at this time.</p>
    <p style="color:#555;line-height:1.7;">This may be because the profile does not currently meet our mentorship requirements. We encourage you to gain more experience and reapply in the future.</p>
    <p style="color:#555;line-height:1.7;">If you believe this decision was made in error or would like feedback, please contact us at <a href="{{site_url}}/#contact" style="color:#7A286F;">our contact page</a>.</p>
    <hr style="border:none;border-top:1px solid #E5E0E5;margin:24px 0;">
    <p style="color:#9C97A0;font-size:12px;text-align:center;">MentorBridge — Connecting people with the right mentors</p>
  </div>
</div>
```

**To Email:** `{{to_email}}`
**To Name:** `{{to_name}}`

---

## Step 5 — Get your Public Key
Dashboard → Account → API Keys → Copy your **Public Key**

---

## Step 6 — Add credentials to admin-dashboard.html
Open: `public/pages/admin-dashboard.html`
Find these lines near the top of the last `<script>` block and replace:

```javascript
var EMAILJS_PUBLIC_KEY  = 'YOUR_PUBLIC_KEY';       // ← paste your public key here
var EMAILJS_SERVICE_ID  = 'mentorbridge_service';  // ← your service ID
var EMAILJS_TEMPLATE_APPROVED = 'mentor_approved'; // ← approval template ID
var EMAILJS_TEMPLATE_DECLINED = 'mentor_declined'; // ← decline template ID
```

---

## That's it!
Once configured, when the admin clicks **Approve** or **Decline** on a mentor application,
an email will automatically be sent to the mentor's registered email address.

- ✅ Approved: email contains a sign-in link
- ✗ Declined: email with a polite message, no sign-in link
