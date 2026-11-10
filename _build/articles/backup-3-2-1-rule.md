---
title: The 3-2-1 backup rule for small offices
topic: IT infrastructure
level: Beginner
summary: How to protect business data against disk failure, deletion, theft and ransomware using the 3-2-1 rule, with a practical plan for a small office and the restore test most people skip.
takeaways: Keep 3 copies of important data, on 2 different types of storage, with 1 copy off-site. | Add at least one copy that ransomware cannot reach: offline or immutable. | Sync is not backup; a deleted or encrypted file syncs too. | A backup you have never restored is only a hope.
---

Hard drives fail, laptops are stolen, people delete the wrong folder, and ransomware encrypts everything it can reach. Backups are the one control that helps in all of these cases, if they are done properly.

## The rule

**3** copies of your data
on **2** different types of storage
with **1** copy off-site.

Example: the live files on the file server (copy 1), a nightly backup to a NAS in the server room (copy 2, different device), and an encrypted copy in cloud storage or on a drive kept at another location (copy 3, off-site).

## The modern extension: 3-2-1-1-0

Ransomware deliberately looks for backup locations it can reach over the network. So many teams now add:

- **1** copy that is **offline or immutable**: a USB drive that is disconnected after the backup, or cloud storage with object lock or version retention that cannot be deleted for a set period.
- **0** errors: backups are checked and test restores succeed.

## Sync is not backup

OneDrive, Google Drive and Dropbox sync are excellent for working, but if a file is deleted or encrypted, the damage syncs to every copy. Version history helps, as described in [OneDrive, SharePoint or Teams](../onedrive-sharepoint-teams/). A real backup is a separate copy with its own retention, under separate credentials.

## A practical plan for a small office

| What | How often | Where | Keep for |
| --- | --- | --- | --- |
| File server or shared folders | Nightly | NAS, plus encrypted cloud copy | 30 daily, 12 monthly |
| Accounting database | Nightly, plus before year-end close | NAS plus an offline drive | 7 years for year-end copies, or as required by law |
| Router and switch configs | After every change | Documentation folder | Last 10 versions |
| CCTV footage | Continuous, on the NVR | Local only (usually) | As per policy, often 15 to 30 days |
| Microsoft 365 mailboxes and OneDrive | Daily | Third-party Microsoft 365 backup | Per policy |

Retention periods are examples. Agree them with management and follow any legal requirements that apply to your business.

## Protect the backups themselves

- Use **separate credentials** for the backup system; a domain administrator account should not be able to delete backups.
- **Encrypt** off-site copies and store the key somewhere safe and separate.
- **Monitor** backup jobs and read the failure emails. A silent failure for three months is common.

## Test the restore

Once a month, restore a random file. Once or twice a year, restore a whole system to spare hardware or a virtual machine and time how long it takes. That number is your real recovery time. It is far better to discover a problem during a test than during an emergency.

## Quick checklist

- [ ] Important data identified and owned
- [ ] Three copies, two media, one off-site
- [ ] One offline or immutable copy
- [ ] Backup credentials separate from everyday admin accounts
- [ ] Job failures monitored
- [ ] Restore tested this month

Related: [Security basics every employee should know](../security-basics-for-staff/)
