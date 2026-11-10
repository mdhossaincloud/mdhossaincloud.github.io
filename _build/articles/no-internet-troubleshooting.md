---
title: “The internet is down”: a step-by-step troubleshooting method
topic: IT troubleshooting
level: Beginner
summary: A repeatable, layer-by-layer method for the most common support call, using built-in Windows commands, so you find the real cause instead of restarting things at random.
takeaways: First find the scope: one user, one floor, one office or everyone. | Work from the cable up: link, IP address, gateway, internet, DNS, application. | An address starting 169.254 means the PC did not get one from DHCP. | If you can ping 8.8.8.8 but websites fail, suspect DNS.
---

"The internet is down" can mean a loose cable, a full DHCP pool, a DNS fault, an ISP outage or a single blocked website. A consistent method finds the cause quickly and gives you facts for the ISP or your manager.

## Step 0: find the scope

Ask two questions before touching anything:

1. **Who is affected?** One person, one department, one office or every site?
2. **What exactly fails?** All websites, one website, email only, or the network drive as well?

One user points to that PC or its cable. A whole office points to the switch, router or ISP. Every site at once points to a shared service such as DNS, the firewall or a cloud provider.

## Step 1: physical link

- Is the network cable plugged in, and are the port lights on?
- On Wi-Fi, is the PC connected to the right network (not a guest network)?
- Has anything changed: a moved desk, a new switch, a power cut?

## Step 2: does the PC have a valid address?

```cmd
ipconfig /all
```

Check the IPv4 address, subnet mask, default gateway and DNS servers.

- An address starting **169.254** means DHCP failed. Try `ipconfig /release` then `ipconfig /renew`. If it still fails, check the DHCP server or the switch port. (See the [DHCP explainer](../../#lab-dhcp).)
- An address in the wrong range usually means a wrong VLAN or a rogue router plugged into the network.

## Step 3: can it reach the gateway?

```cmd
ping 192.168.1.1
```

Use the default gateway shown by `ipconfig`. No reply suggests a local network problem: cable, switch, VLAN or the router itself.

## Step 4: can it reach the internet by IP address?

```cmd
ping 8.8.8.8
tracert 8.8.8.8
```

If the gateway replies but this does not, the problem is between your router and the internet: the ISP link, the WAN connection or a firewall rule. `tracert` shows where the path stops.

## Step 5: does name resolution work?

```cmd
nslookup www.microsoft.com
ipconfig /flushdns
```

If `ping 8.8.8.8` works but websites do not load, **suspect DNS**. Check which DNS server the PC uses and whether that server is reachable. (See the [DNS explainer](../../#lab-dns).)

## Step 6: the application

If all of the above works, the network is fine and the problem is higher up: a browser proxy setting, an expired certificate, a blocked website, an outage at the service, or the user's account.

## Write it down

Close every ticket with three lines: **what was wrong, what fixed it, and how to prevent it.** After a month these notes show patterns, such as one switch that fails every week, that no single ticket reveals.

## Quick reference

| Symptom | Most likely layer | First check |
| --- | --- | --- |
| No lights, "network cable unplugged" | Physical | Cable, port, switch power |
| 169.254.x.x address | DHCP | DHCP server, VLAN, switch port |
| Gateway does not reply | Local network | Switch, VLAN, router |
| Gateway replies, 8.8.8.8 does not | WAN / ISP | Router WAN status, ISP |
| 8.8.8.8 replies, sites fail | DNS | DNS server settings |
| Only one site fails | Application | Site status, firewall, proxy |

Related: [IP addresses and subnets](../ip-addressing-subnetting-basics/) · [PowerShell for IT support](../powershell-first-commands/)
