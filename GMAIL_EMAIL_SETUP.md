# Gmail activation email setup

This project is configured to send real activation emails using Gmail SMTP.

## 1. Create a Google App Password

Do not use your normal Gmail password. Google SMTP needs a 16-character Google App Password.

Steps:
1. Open your Google Account.
2. Turn on 2-Step Verification.
3. Open App Passwords.
4. Create an app password for Mail / Other app.
5. Copy the 16-character password.

If Google shows spaces in the password, you may paste it with or without spaces. The project removes spaces automatically.

## 2. Edit `.env`

Replace the sample values:

```env
EMAIL_HOST_USER=yourgmail@gmail.com
EMAIL_HOST_PASSWORD=your_16_character_google_app_password
DEFAULT_FROM_EMAIL=yourgmail@gmail.com
```

Example format only:

```env
EMAIL_HOST_USER=myaccount@gmail.com
EMAIL_HOST_PASSWORD=abcdefghijklmnop
DEFAULT_FROM_EMAIL=myaccount@gmail.com
```

## 3. Test before registering

Run this from the Django backend folder, the same folder that has `manage.py`:

```bash
python manage.py test_gmail yourgmail@gmail.com
```

Expected result:

```text
Sent 1 test email to yourgmail@gmail.com.
```

Check Inbox, Spam, and All Mail.

## 4. Run the project

```bash
python manage.py runserver
```

Now register a new account using a real email address. The activation email should be delivered to that email.

## Common errors

### Username and Password not accepted / SMTPAuthenticationError
You are using the normal Gmail password instead of a Google App Password, or the App Password was revoked.

### EMAIL_HOST_PASSWORD is empty
Your `.env` file is not in the same folder as `manage.py`, or the value is missing.

### Email says sent but not in Inbox
Check Spam, All Mail, and the registered user email address. Also test using another recipient email address.
