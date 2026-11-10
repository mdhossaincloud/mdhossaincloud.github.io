---
title: Microsoft 365 basics: what is inside and how it fits together
topic: Microsoft 365
level: Beginner
summary: A plain-language tour of Microsoft 365 for new IT staff and business owners: the core services, how sign-in works, which plan does what, and the admin centres you will use every day.
takeaways: Microsoft 365 is a set of cloud services tied together by one identity, Microsoft Entra ID. | Exchange Online handles email, OneDrive personal files, SharePoint shared files, Teams chat and meetings. | Business plans cover up to 300 users; Premium adds device management and stronger security. | Most daily admin work starts in the Microsoft 365 admin center.
---

Microsoft 365 is not one program. It is a subscription that bundles cloud services (email, file storage, chat and meetings) with the familiar Office apps and a shared identity system. Understanding how the pieces connect makes almost every support ticket easier.

## The one thing that ties it together: identity

Every Microsoft 365 user has an account in **Microsoft Entra ID** (formerly Azure Active Directory). When someone signs in to Outlook, Teams or OneDrive, they are really signing in to Entra ID, which then gives them access to each service their licence allows.

This is why a single password reset or a blocked sign-in affects everything at once, and why multifactor authentication protects every service in one step. The [Microsoft 365 identity explainer](../../#lab-m365) in the Infrastructure Lab walks through a sign-in step by step.

## The core services

| Service | What it does | Typical support questions |
| --- | --- | --- |
| Exchange Online | Business email, calendars, contacts, shared mailboxes | "I can't send to an outside address", "Give me access to the sales mailbox" |
| OneDrive | Each user's personal cloud storage, synced to their PC | "My files aren't syncing", "I deleted a folder by mistake" |
| SharePoint | Shared storage and intranet sites for teams and departments | "Who can see this folder?", "Create a site for the new project" |
| Teams | Chat, meetings, calls and team workspaces (files live in SharePoint) | "My microphone doesn't work", "Add a guest to our team" |
| Office apps | Word, Excel, PowerPoint, Outlook on the web, mobile and desktop | "Office says it is unlicensed" |
| Intune | Manages and secures laptops and phones (in some plans) | "Enrol this new laptop", "Wipe the lost phone" |

A useful rule: **OneDrive is mine, SharePoint is ours, Teams is where we talk about it.** There is a [full guide on where files should live](../onedrive-sharepoint-teams/).

## Choosing a plan

Microsoft sells several business plans. Names and prices change, so always confirm on Microsoft's site, but the pattern has stayed stable:

- **Business Basic**: email, Teams, OneDrive and SharePoint, with the web and mobile versions of the Office apps.
- **Business Standard**: everything in Basic plus the installable desktop Office apps.
- **Business Premium**: everything in Standard plus Intune device management, Entra ID P1 (Conditional Access) and Microsoft Defender for Business.

Business plans are capped at 300 users; larger organisations use Enterprise plans (E3, E5 and similar). In some regions Teams is sold separately from the suite, so check what a plan includes before you buy.

## The admin centres

You will spend most of your time in a few places:

1. **Microsoft 365 admin center** (admin.microsoft.com): users, licences, groups, billing, service health.
2. **Exchange admin center**: mail flow, shared mailboxes, distribution lists.
3. **Microsoft Entra admin center**: sign-in logs, MFA, security defaults, Conditional Access.
4. **Intune admin center**: device enrolment, compliance and app deployment.
5. **SharePoint and Teams admin centers**: sharing settings, sites, meeting policies.

When a user reports that "Outlook is down", check **Service health** in the Microsoft 365 admin center first. It takes ten seconds and tells you whether the problem is Microsoft's or yours.

## A sensible first-week checklist for a new tenant

1. Turn on [multifactor authentication](../m365-mfa-security-defaults/) for every account, starting with administrators.
2. Keep at least two global administrators, and use separate admin accounts rather than everyday mailboxes.
3. Verify your company domain and set up SPF, DKIM and DMARC records so your email is trusted.
4. Decide your file structure in SharePoint before people start saving everywhere.
5. Document who has which licence. Unused licences are the most common hidden cost.

## Where to learn more

Microsoft Learn has free, official training paths. The *Microsoft 365 Fundamentals* material is a good next step, followed by the administrator paths once you manage a tenant day to day.
