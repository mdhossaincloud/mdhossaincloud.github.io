---
title: Active Directory basics: domains, OUs, users, groups and Group Policy
topic: Windows administration
level: Beginner
summary: The building blocks of an on-premises Windows network explained for new IT staff: what a domain controller does, how to organise objects, how to grant access with groups, and how Group Policy is applied.
takeaways: A domain controller stores accounts and checks every sign-in on the network. | Organisational units (OUs) are for organising and applying policy; groups are for granting access. | Give permissions to groups, never directly to individual users. | Group Policy applies in the order Local, Site, Domain, OU, and refreshes about every 90 minutes.
---

Active Directory Domain Services (AD DS) is the directory most Windows offices run on. It stores user accounts, computers and groups, and it lets one administrator manage hundreds of PCs from one place.

## The main pieces

- **Domain**: a security boundary with its own name, for example `corp.example.com`. Users sign in to the domain, not to each PC.
- **Domain controller (DC)**: a Windows Server that holds a copy of the directory and checks every sign-in. Run at least two so one can fail or be patched without stopping work.
- **Objects**: users, computers, groups, printers. Each has attributes such as name, department and manager.
- **Organisational units (OUs)**: folders inside the directory used to organise objects and to target Group Policy.
- **DNS**: AD depends on it. Domain-joined PCs must use the domain controllers as their DNS servers, or sign-in and policy will fail in confusing ways.

## OUs organise, groups grant

A common beginner mistake is to use OUs to control access. They do different jobs:

| | Organisational unit | Security group |
| --- | --- | --- |
| Purpose | Organise objects, delegate admin rights, link Group Policy | Grant access to files, printers, apps |
| An object can be in | One OU at a time | Many groups |
| Example | `OU=Dhaka,OU=Computers` | `GG-Accounts-Users` |

A simple, scalable structure separates **users** and **computers**, then sub-divides by location or department.

## Grant access with groups (AGDLP)

Never give a folder permission to an individual user. When that person changes role, nobody remembers to remove it. Instead, Microsoft's long-standing pattern is **AGDLP**:

1. **A**ccounts go into
2. **G**lobal groups (by role, for example *Accounts team*), which go into
3. **D**omain **L**ocal groups (by resource, for example *Finance share – Modify*), which receive the
4. **P**ermission on the resource.

In small offices you can simplify to "users into role groups, role groups onto resources". The principle is the same: change group membership, not permissions.

## Group Policy in one page

Group Policy Objects (GPOs) push settings to users and computers: password rules, mapped drives, Windows Update behaviour, desktop restrictions.

- **Processing order: Local → Site → Domain → OU (LSDOU).** The last policy applied wins when settings conflict, so OU policies override domain policies.
- **Computer settings** apply at start-up; **user settings** apply at sign-in.
- Policies refresh in the background about every **90 minutes**, with a random offset of up to 30 minutes.

Useful commands on a client PC:

```powershell
gpupdate /force        # apply policy now
gpresult /r            # summary of applied policies
gpresult /h report.html  # full HTML report
```

## Everyday tasks

- **Create a user** with the right OU, group memberships and a temporary password that must be changed at first sign-in.
- **Unlock an account** after too many wrong passwords (Active Directory Users and Computers → Account tab).
- **Disable, don't delete**, when someone leaves: disable the account, remove group memberships, and keep it for an agreed period.
- **Join a PC to the domain** from *System → About → Domain or workgroup*, using an account allowed to join computers.

Many of these tasks are faster in PowerShell. See [PowerShell for IT support](../powershell-first-commands/).
