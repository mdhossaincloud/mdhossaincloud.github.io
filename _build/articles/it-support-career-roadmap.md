---
title: Starting a career in IT support: a practical roadmap
topic: IT career development
level: Beginner
summary: The skills, free learning resources, home-lab ideas and certifications that take someone from curious beginner to confident IT support professional, based on the path I followed myself.
takeaways: Start with fundamentals: hardware, Windows, networking basics and clear communication. | Build a small home lab; practice beats reading. | Choose certifications that match the jobs you want, not the longest list. | Document what you learn; it becomes your portfolio.
---

I started on a factory support desk in 2018. Most of what made me useful there was not a certificate. It was being able to fix things calmly, explain them clearly and write them down. This roadmap is the path I would recommend to someone starting today.

## Stage 1: foundations (first 3 to 6 months)

**Learn how a computer and an office network work.**

- **Hardware**: components, building and upgrading a PC, diagnosing a failed drive or RAM stick.
- **Windows**: installation, user accounts, drivers, updates, Event Viewer, Task Manager.
- **Networking basics**: [IP addresses and subnets](../ip-addressing-subnetting-basics/), DHCP, DNS, Wi-Fi. Try the [OSI model explainer](../../#lab-osi).
- **Troubleshooting method**: start with the [step-by-step "internet is down" guide](../no-internet-troubleshooting/).
- **Customer service**: listening, setting expectations, writing a clear ticket update.

Good free starting points: Professor Messer's CompTIA A+ videos, Microsoft Learn, and Cisco Networking Academy (which includes the free Packet Tracer simulator).

## Stage 2: business IT skills (6 to 12 months)

**Learn the systems companies actually run.**

- [Active Directory and Group Policy](../active-directory-basics/)
- [Microsoft 365 administration](../microsoft-365-basics/), including [MFA](../m365-mfa-security-defaults/)
- [PowerShell basics](../powershell-first-commands/)
- Ticketing and ITIL basics: incidents, requests, problems, changes and SLAs
- Backups and [security fundamentals](../security-basics-for-staff/)

## Build a home lab

You learn fastest by breaking and fixing your own systems:

- **Virtualisation**: Hyper-V (built into Windows Pro) or VirtualBox (free).
- **Windows Server**: Microsoft offers a free 180-day evaluation. Build a domain controller, create users, apply a GPO.
- **Networking**: Cisco Packet Tracer for switching and routing; MikroTik CHR runs as a virtual router for free with a speed limit, which is ideal for practice.
- **Microsoft 365**: a trial tenant lets you practise user and licence management.

Keep notes of every lab in a simple document or on GitHub. They show employers how you think.

## Certifications: pick by goal

| Goal | Good options |
| --- | --- |
| First help-desk job | Google IT Support Professional Certificate, CompTIA A+ |
| Networking focus | CompTIA Network+, Cisco CCNA |
| Microsoft environments | Microsoft 365 Fundamentals, then administrator-level Microsoft certifications |
| Security interest | CompTIA Security+ after you have networking basics |

Check the official sites for the current exam versions, because they change. A training course certificate is valuable learning; say so honestly and list the vendor exam separately once you pass it.

## Stage 3: grow into a specialist

After a year or two of real tickets, choose a direction you enjoy: networking, Microsoft 365 and identity, endpoint management, cloud, or security. Depth in one area, with broad basics, is what moves you from support into administration and engineering roles.

## Habits that matter more than any certificate

1. **Write it down.** Every fix you document saves the next person an hour.
2. **Own the ticket** until the user confirms it is solved.
3. **Explain without jargon.** Managers and recruiters remember people who make technology simple.
4. **Stay curious.** Read one technical article a day. This Knowledge Hub is a good place to start.
