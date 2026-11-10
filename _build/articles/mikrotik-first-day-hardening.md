---
title: Securing a new MikroTik router: a first-day checklist
topic: MikroTik
level: Intermediate
summary: The hardening steps to complete before a MikroTik router goes into service: firmware, accounts, management services, discovery, firewall and backups, with RouterOS commands for each.
takeaways: Update RouterOS and the RouterBOARD firmware before anything else. | Replace the default admin account and use a strong, unique password. | Turn off management services you do not use, and allow the rest only from the management network. | Keep the default input firewall rules, and export a backup after every change.
---

MikroTik routers are powerful and affordable, which is why they are everywhere in Bangladeshi offices. They are also scanned constantly from the internet. Most compromised MikroTik devices were running old firmware or left management open to the world. This checklist closes those gaps.

> Run these steps from a computer on the LAN side, and keep a second way in (console or a local Winbox session) until you have confirmed you have not locked yourself out. Interface lists named `LAN` and `WAN` exist in the default configuration; adjust names to match yours.

## 1. Update RouterOS and the firmware

```routeros
/system package update check-for-updates
/system package update install
# after the reboot:
/system routerboard upgrade
/system reboot
```

Use the *stable* channel for production. Read the changelog for major version jumps.

## 2. Replace the default account

```routeros
/user add name=netadmin group=full password="a-long-unique-passphrase"
# sign in as netadmin and test, then:
/user disable admin
```

Newer devices ship with a unique password printed on the label, but a named personal account is still better for accountability.

## 3. Turn off unused management services

```routeros
/ip service disable telnet,ftp,www,api,api-ssl
/ip service set winbox address=192.168.88.0/24
/ip service set ssh address=192.168.88.0/24
```

Replace `192.168.88.0/24` with your management subnet. Telnet and FTP send passwords in plain text and should never be enabled.

## 4. Limit discovery to the LAN

```routeros
/tool mac-server set allowed-interface-list=LAN
/tool mac-server mac-winbox set allowed-interface-list=LAN
/ip neighbor discovery-settings set discover-interface-list=LAN
```

This stops the router from announcing itself, or accepting MAC-based logins, on the WAN side.

## 5. Keep a sane input firewall

The default configuration protects the router itself with rules in the **input** chain. Confirm they are present and in this order:

```routeros
/ip firewall filter
add chain=input action=accept connection-state=established,related,untracked
add chain=input action=drop connection-state=invalid
add chain=input action=accept protocol=icmp
add chain=input action=drop in-interface-list=!LAN comment="drop all not coming from LAN"
```

If you allow DNS requests from clients (`/ip dns set allow-remote-requests=yes`), this last rule is what stops your router from becoming an open DNS resolver for the internet.

## 6. Small settings that help later

```routeros
/system identity set name=DHK-HQ-RTR01
/system clock set time-zone-name=Asia/Dhaka
/system ntp client set enabled=yes servers=pool.ntp.org
```

Correct time makes logs trustworthy; a clear name prevents changes on the wrong device.

## 7. Back up, twice

```routeros
/export file=DHK-HQ-RTR01-2026-11-10
/system backup save name=DHK-HQ-RTR01-2026-11-10 encryption=aes-sha256 password="another-passphrase"
```

The **export** is a readable script, ideal for review and documentation. The **binary backup** restores the same device fully. Copy both off the router. A backup that lives only on the device is not a backup.

## Before you leave site

- [ ] Firmware updated, version recorded
- [ ] Default admin disabled, personal admin account created
- [ ] Unused services disabled, remaining services restricted
- [ ] Discovery limited to LAN
- [ ] Input firewall rules verified
- [ ] Identity, time zone and NTP set
- [ ] Export and backup copied to documentation

Related: [IP addresses and subnets](../ip-addressing-subnetting-basics/) · [Site-to-site VPN explainer](../../#lab-vpn) · [Firewall explainer](../../#lab-firewall)
