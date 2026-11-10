---
title: PowerShell for IT support: the commands to learn first
topic: Windows administration
level: Intermediate
summary: A practical starter set of PowerShell commands for help-desk and system administration work, grouped by the questions you actually get asked, with safe habits for running scripts.
takeaways: Get-Help and Get-Command teach you PowerShell from inside PowerShell. | Test-NetConnection and Resolve-DnsName answer most "can this PC reach that server?" questions. | The ActiveDirectory module turns slow clicking into one-line answers. | Read a script before you run it, and test changes with -WhatIf.
---

PowerShell is Windows' command line and scripting language. You do not need to be a programmer to benefit. Learning a dozen commands well saves time on every shift.

## How to read a command

Commands follow a **Verb-Noun** pattern: `Get-Service`, `Restart-Service`, `Get-ADUser`. Parameters start with a dash. The pipe `|` passes results to the next command.

```powershell
Get-Help Get-Service -Examples   # show worked examples
Get-Command *dns*                # find commands by name
```

## "Is this PC set up correctly?"

```powershell
Get-ComputerInfo -Property CsName, OsName, OsVersion, CsDomain
Get-NetIPConfiguration           # IP address, gateway and DNS per adapter
Get-CimInstance Win32_LogicalDisk -Filter "DriveType=3" |
  Select-Object DeviceID, @{n='FreeGB';e={[math]::Round($_.FreeSpace/1GB,1)}}
```

## "Can this PC reach the server?"

```powershell
Test-NetConnection fileserver01               # ping-style reachability
Test-NetConnection mail.example.com -Port 443 # is the port open?
Resolve-DnsName intranet.example.com          # what does DNS return?
```

`Test-NetConnection` with `-Port` is often more useful than ping, because many networks block ping while the real service still works.

## "Something stopped working"

```powershell
Get-Service Spooler                    # printer spooler status
Restart-Service Spooler                # the classic printer fix
Get-Process | Sort-Object CPU -Descending | Select-Object -First 5
Get-WinEvent -LogName System -MaxEvents 20   # recent system events
```

## Active Directory one-liners

These need the **ActiveDirectory** module (installed with RSAT, or on a domain controller).

```powershell
Search-ADAccount -LockedOut | Select-Object Name, SamAccountName
Unlock-ADAccount -Identity j.rahman
Get-ADUser j.rahman -Properties LastLogonDate, PasswordLastSet, Enabled
Get-ADGroupMember "GG-Accounts-Users" | Select-Object Name
Search-ADAccount -AccountInactive -TimeSpan 90.00:00:00 -UsersOnly
```

The last line lists user accounts with no sign-in for 90 days, a useful monthly security check.

## Safe habits

1. **Use -WhatIf** on commands that change things. It shows what would happen without doing it.
2. **Read every script** you download before running it. If you cannot explain a line, do not run it on a production system.
3. **Keep the execution policy** at a sensible default such as `RemoteSigned`. Do not set it to `Unrestricted` to "make a script work".
4. **Log what you change.** `Start-Transcript` records a whole session to a text file, which is useful for change records.
5. **Never put passwords in scripts.** Use `Get-Credential` or a proper secrets store.

## Practise safely

Build a small lab with a Windows Server evaluation copy (free for 180 days) in Hyper-V or VirtualBox, promote it to a domain controller, and practise there, never on a live network first.

Related: [Active Directory basics](../active-directory-basics/) · [Troubleshooting "the internet is down"](../no-internet-troubleshooting/)
