---
title: How much storage does a CCTV system need?
topic: IT infrastructure
level: Intermediate
summary: The formula for sizing NVR storage from camera bitrate, recording hours and retention, a worked example, an interactive calculator, and the factors that change the answer in practice.
takeaways: Storage depends on bitrate, recording hours, retention days and the number of cameras. | Storage (GB) = bitrate (Mbps) × 3600 × hours per day × days ÷ 8 ÷ 1000, per camera. | H.265 and motion-based recording can cut storage needs substantially. | Add about 20% headroom, and use surveillance-rated drives.
scripts: calc.js
---

When a client asks "how many days of footage will we keep?", the answer comes from simple arithmetic, not guesswork. Getting it right avoids NVRs that overwrite evidence after three days, or drives bought for footage no one needs.

## The formula

For **one camera** recording continuously:

**Storage (GB) = bitrate (Mbps) × 3,600 × hours per day × days ÷ 8 ÷ 1,000**

- Bitrate is in megabits per second, as set in the camera or NVR.
- × 3,600 converts seconds to hours.
- ÷ 8 converts bits to bytes, and ÷ 1,000 converts megabytes to gigabytes.

Multiply the result by the number of cameras with the same settings.

## Worked example

A shop with **8 cameras** at **4 Mbps**, recording **24 hours a day**, keeping **30 days**:

- Per camera: 4 × 3,600 × 24 × 30 ÷ 8 ÷ 1,000 = **1,296 GB** (about 1.3 TB)
- For 8 cameras: 1,296 × 8 = **10,368 GB**, about **10.4 TB**
- With 20% headroom: about **12.4 TB**, so a 2 × 8 TB or 4 × 4 TB configuration, depending on the NVR and redundancy.

## Calculator

<div class="calc" id="cctv-calc">
  <div class="calc-grid">
    <label>Cameras<input type="number" name="cams" min="1" max="2000" value="8" inputmode="numeric"></label>
    <label>Bitrate per camera (Mbps)<input type="number" name="rate" min="0.25" max="50" step="0.25" value="4" inputmode="decimal"></label>
    <label>Recording hours per day<input type="number" name="hours" min="1" max="24" value="24" inputmode="numeric"></label>
    <label>Retention (days)<input type="number" name="days" min="1" max="365" value="30" inputmode="numeric"></label>
  </div>
  <p class="calc-out" aria-live="polite"><span>Estimated storage</span><b id="calc-total">10.4 TB</b><small id="calc-detail">1,296 GB per camera · 12.4 TB with 20% headroom</small></p>
</div>

## Typical bitrates

Real values depend on the camera, scene and settings, so read them from the device where you can. As a rough guide for continuous recording:

| Resolution | H.264 | H.265 |
| --- | --- | --- |
| 2 MP (1080p) | 4 Mbps | 2 Mbps |
| 4 MP | 6 Mbps | 3 to 4 Mbps |
| 8 MP (4K) | 12 to 16 Mbps | 6 to 8 Mbps |

## What changes the answer

- **Codec**: H.265 typically needs around half the bitrate of H.264 for similar quality.
- **Motion or event recording**: in quiet areas this can reduce storage a lot, but it relies on detection working well.
- **Scene**: busy roads, trees moving in the wind and night-time noise all raise the bitrate.
- **Sub-streams**: some NVRs also record a low-resolution stream; include it if enabled.
- **Redundancy**: RAID or mirroring uses part of the raw disk capacity.
- **Drive marketing**: drives are sold in decimal terabytes, while operating systems may show smaller binary values.

## Practical advice

- Use **surveillance-rated hard drives**, designed for continuous writing.
- Put cameras on their **own VLAN**, as shown in the [CCTV/NVR explainer](../../#lab-cctv), so video traffic does not slow the office network.
- Check retention after installation: look at the oldest footage on the NVR after the first week and compare it with your estimate.
- Agree retention in writing with the client, and follow any rules about recording and privacy that apply to the premises.

Related: [IP addresses and subnets](../ip-addressing-subnetting-basics/) · [The 3-2-1 backup rule](../backup-3-2-1-rule/)
