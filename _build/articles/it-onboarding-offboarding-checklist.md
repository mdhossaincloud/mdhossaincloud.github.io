---
title: IT onboarding and offboarding checklist
topic: Practical IT guides
level: Beginner
summary: A ready-to-use checklist for setting up a new employee on day one and removing access cleanly when someone leaves, for offices using Windows, Active Directory and Microsoft 365.
takeaways: Start IT set-up from an HR request with a start date, role and manager. | Grant access by role groups, so new joiners get the right access automatically. | On the last day, disable sign-in first, then hand over data and recover equipment. | Keep a record of every step; it protects the company and the IT team.
---

Joiners and leavers are where IT and security meet HR. A checklist makes both fast and consistent, and it prevents the two most common failures: a new employee who cannot work on day one, and a former employee who can still sign in months later.

## Before day one: onboarding

**Trigger**: a request from HR or the line manager with name, job title, department, start date, manager and office location.

### Accounts

- [ ] Create the Active Directory user in the correct OU, with title, department and manager filled in
- [ ] Add to role groups (for example *Accounts team*), not individual permissions; see [Active Directory basics](../active-directory-basics/)
- [ ] Assign the Microsoft 365 licence and create the mailbox
- [ ] Add to the right Teams, distribution lists and shared mailboxes
- [ ] Create accounts in business applications (ERP, accounting, ticketing) as approved by the manager
- [ ] Set a temporary password that must be changed at first sign-in

### Equipment

- [ ] Prepare the laptop or desktop from the standard image, fully updated
- [ ] Record the asset tag and serial number against the user in the asset register
- [ ] Phone, headset, monitor and peripherals as required
- [ ] Printer and network drive access tested

### Day one

- [ ] Sign in together; set up [MFA](../m365-mfa-security-defaults/) and the Authenticator app
- [ ] Show where to save files: [OneDrive, SharePoint or Teams](../onedrive-sharepoint-teams/)
- [ ] Explain how to contact IT and log a ticket
- [ ] Share [security basics](../security-basics-for-staff/) and the acceptable-use policy; get acknowledgement
- [ ] Close the onboarding ticket with a list of what was granted

## On the last day: offboarding

**Trigger**: a confirmed leaving date from HR. For sensitive roles or a sudden departure, remove access at the time of the conversation, not at the end of the day.

### Access (first, and in this order)

- [ ] Disable the Active Directory account and block Microsoft 365 sign-in
- [ ] Revoke active sessions so phones and browsers are signed out
- [ ] Reset the password, and remove MFA methods and registered devices
- [ ] Remove VPN, remote access, Wi-Fi certificates and business application accounts
- [ ] Change any shared passwords the person knew

### Data

- [ ] Convert the mailbox to a shared mailbox, or give the manager access for an agreed period
- [ ] Set an automatic reply directing contacts to the new person
- [ ] Transfer OneDrive files the business needs to the manager or a SharePoint site
- [ ] Remove the licence once data is safely handed over

### Equipment

- [ ] Collect the laptop, phone, access cards and keys; check against the asset register
- [ ] Back up anything required, then wipe and re-image the device before reuse

### Records

- [ ] Remove from groups, distribution lists and Teams
- [ ] Record every step and the date in the offboarding ticket
- [ ] Delete the account only after the retention period agreed with management

## Make it automatic over time

Once the checklist is stable, scripts can do most of it: a PowerShell script that creates the user, sets groups by job title and assigns the licence takes minutes to run and never forgets a step. See [PowerShell for IT support](../powershell-first-commands/).
