---
title: IP addresses, subnets and gateways without the fear
topic: Networking
level: Beginner
summary: What an IPv4 address, subnet mask and default gateway really mean, how to read CIDR notation such as /24, and a reference table you can use on the job.
takeaways: An IPv4 address has a network part and a host part; the subnet mask says where one ends. | A /24 network has 256 addresses and 254 usable for devices. | Each step down (/25, /26...) halves the size of the network. | Private ranges are 10.0.0.0/8, 172.16.0.0/12 and 192.168.0.0/16.
---

Every device on a network needs three things to talk to the world: an **IP address**, a **subnet mask** and a **default gateway**. Understanding them turns many "mystery" network problems into simple checks.

## The address

An IPv4 address is 32 bits, written as four numbers from 0 to 255, for example `192.168.10.25`. Part of it identifies the **network**, and the rest identifies the **device (host)** on that network.

## The subnet mask

The mask tells the device which part is which. `255.255.255.0` means the first three numbers are the network and the last number is the host.

- `192.168.10.25` with mask `255.255.255.0` → network `192.168.10.0`, host `25`.

Devices on the **same** network talk directly. To reach a **different** network, they send traffic to the gateway.

## CIDR notation

Instead of writing the mask, engineers often write how many bits belong to the network: `192.168.10.0/24`. The `/24` means 24 network bits, which is the same as `255.255.255.0`.

## The default gateway

The gateway is the router's address on the local network, often `.1`. If it is wrong or missing, the PC can reach its neighbours but nothing beyond. That is a classic "I can print but not browse" symptom.

## Reference table

| CIDR | Subnet mask | Total addresses | Usable hosts | Typical use |
| --- | --- | --- | --- | --- |
| /24 | 255.255.255.0 | 256 | 254 | A floor or a small office |
| /25 | 255.255.255.128 | 128 | 126 | Half an office |
| /26 | 255.255.255.192 | 64 | 62 | A department or camera VLAN |
| /27 | 255.255.255.224 | 32 | 30 | Printers or servers |
| /28 | 255.255.255.240 | 16 | 14 | Network devices |
| /30 | 255.255.255.252 | 4 | 2 | A point-to-point link |

Two addresses in every subnet are reserved: the **network address** (the first) and the **broadcast address** (the last). That is why a /24 has 254 usable hosts, not 256.

## Private and special ranges

These ranges are reserved for internal networks and are not routed on the public internet (RFC 1918):

- `10.0.0.0/8`
- `172.16.0.0/12` (172.16.0.0 to 172.31.255.255)
- `192.168.0.0/16`

Also worth knowing:

- `127.0.0.1` is the device itself (loopback).
- `169.254.x.x` is a self-assigned address when DHCP fails.

## Planning a small office

A tidy plan separates device types into their own subnets (and VLANs), for example:

| Subnet | Purpose |
| --- | --- |
| 10.10.10.0/24 | Staff computers |
| 10.10.20.0/24 | Wi-Fi for staff |
| 10.10.30.0/24 | Guest Wi-Fi (internet only) |
| 10.10.40.0/24 | IP cameras and NVR |
| 10.10.50.0/27 | Servers and printers |

Keep the plan in a spreadsheet and update it whenever you assign a fixed address. See the [VLAN explainer](../../#lab-vlan) for how these networks stay separate on the same switches.

Related: ["The internet is down"](../no-internet-troubleshooting/)
