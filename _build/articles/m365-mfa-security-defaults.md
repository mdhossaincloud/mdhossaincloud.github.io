---
title: Turning on multifactor authentication in Microsoft 365
topic: Microsoft 365
level: Beginner
summary: Why a password alone is no longer enough, how security defaults switch on MFA for a whole Microsoft 365 tenant in one setting, and how to roll it out without a flood of support calls.
takeaways: Most account takeovers start with a stolen or reused password; MFA stops the large majority of them. | Security defaults are free and turn on MFA, block legacy sign-in and protect admin accounts. | Conditional Access gives finer control but needs Entra ID P1 (included in Business Premium). | Tell users before the change and show them the Authenticator app in person.
---

A password can be guessed, reused from another breached website, or typed into a fake login page. **Multifactor authentication (MFA)** adds a second proof, usually an approval in the Microsoft Authenticator app, so a stolen password alone is not enough to get in. Microsoft has repeatedly reported that MFA blocks the overwhelming majority of automated account attacks.

## Option 1: Security defaults (free, every tenant)

Security defaults are a single switch that applies a sensible baseline:

- Every user must register for MFA (they get a grace period of 14 days).
- Administrators are asked for MFA on every sign-in.
- **Legacy authentication is blocked.** Old protocols such as basic-auth POP, IMAP and SMTP cannot do MFA, so attackers use them to bypass it.
- Sensitive actions, such as using the Azure portal, require MFA.

Tenants created in recent years usually have security defaults switched on already. To check:

1. Sign in to the **Microsoft Entra admin center** as a global administrator.
2. Go to **Entra ID** (or **Identity**) → **Overview** → **Properties**. Menu names change occasionally.
3. Select **Manage security defaults** and confirm it is **Enabled**.

## Option 2: Conditional Access (Entra ID P1)

Conditional Access lets you write rules: require MFA only outside the office network, block sign-ins from countries you never work from, or allow only company-managed laptops. It needs **Entra ID P1**, which is included in Microsoft 365 Business Premium and the E3/E5 plans.

You cannot use security defaults and Conditional Access policies at the same time. If you move to Conditional Access, recreate the same baseline first (MFA for all users, block legacy authentication) before switching security defaults off.

## Rolling it out without chaos

1. **Announce it a week ahead.** Explain why in one paragraph: "this protects your email and files even if your password leaks".
2. **Start with IT and management** so leaders are already using it when everyone else starts.
3. **Install the Authenticator app together.** A ten-minute session at each office saves hours of tickets.
4. **Register two methods** where possible (the app plus a phone number), so a lost phone does not lock someone out.
5. **Prepare the help desk**: know how to require re-registration for a user who changes phones.
6. **Check old devices**: scanners and line-of-business apps that send email over SMTP may need a modern method once legacy authentication is blocked.

## Common questions

**"Will it ask me every time?"** No. With normal settings, users are prompted on new devices and from time to time, not on every click.

**"What if I lose my phone?"** An administrator can require the user to register again after verifying their identity in person or by a known phone number. Never reset MFA based only on an email request.

**"Is SMS good enough?"** It is far better than nothing, but app-based approvals with number matching are stronger and should be the default.

Related: [Microsoft 365 basics](../microsoft-365-basics/) · [Security basics every employee should know](../security-basics-for-staff/)
