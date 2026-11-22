/* Device Explorer (v4.5): isometric exploded views of real network devices.
   Drag the bar to pull a device apart, hover or tap a part to learn what it does.
   Also powers the three small hero objects that explode and vanish on scroll.
   Dependency-free SVG. Generic educational models; no real configuration is shown. */
(() => {
  'use strict';
  const NS = 'http://www.w3.org/2000/svg';
  const L = Object.assign({
    exTabs: 'Choose a device', exAssembled: 'Assembled', exExploded: 'Exploded', exBar: 'Drag to explode the device',
    exHint: 'Drag the bar to pull the device apart, then hover or tap a part to see what it does.',
    exWhat: 'What it does', exCheck: 'What I check', exParts: 'Parts'
  }, window.I18N || {});
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const C = 0.866, H = 0.5;                       /* isometric constants */
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const ease = (t) => 1 - Math.pow(1 - t, 3);

  /* part: id, name, size [w,d,h], assembled position [x,y,z], explode offset [dx,dy,dz], colour, what, check */
  const DEVICES = {
    router: { name: 'Router', short: 'MikroTik-class', parts: [
      { id: 'base', n: 'Chassis and base plate', b: [8, 5, .6], p: [0, 0, 0], e: [0, 0, 0], c: '#5f7191',
        w: 'The case holds every board in place and carries heat away. Many routers rely on the metal body as a passive heat sink.',
        k: 'Ventilation and mounting. In a hot cabinet, temperature is the first thing I look at before blaming the router.' },
      { id: 'psu', n: 'Power input and regulators', b: [2.6, 1.8, .5], p: [.5, .5, .6], e: [-1.2, 1.8, 1.6], c: '#c9862e',
        w: 'Turns the supply (DC adapter or PoE-in) into the several stable voltages the CPU, memory and ports need.',
        k: 'Input voltage and adapter. A failing supply shows up as random reboots and “power failure” entries in the log.' },
      { id: 'pcb', n: 'Mainboard (PCB)', b: [7.2, 4.2, .25], p: [.4, .4, 1.1], e: [0, 0, 3.0], c: '#2f8f6b',
        w: 'The green board that every chip plugs into. Copper traces carry data between CPU, memory, switch chip and ports.',
        k: 'Rarely touched on site: board faults usually mean replacement, so I keep a tested config backup ready.' },
      { id: 'cpu', n: 'CPU and heat sink', b: [2.2, 2.2, .7], p: [3.2, 1.2, 1.35], e: [0, 0, 5.0], c: '#4d8dff',
        w: 'Runs the operating system and does the thinking: routing, NAT, firewall rules and VPN encryption.',
        k: 'CPU load. On RouterOS: /system resource print. High load often comes from firewall rules that skip the fast path.' },
      { id: 'ram', n: 'RAM and flash storage', b: [1.5, 1.1, .4], p: [5.9, 1.0, 1.35], e: [1.2, -.4, 4.2], c: '#8b9cff',
        w: 'RAM holds the live connection table and routes. Flash stores the firmware and the saved configuration.',
        k: 'Free memory and a recent configuration export. Flash survives power loss; RAM does not.' },
      { id: 'sw', n: 'Switch chip', b: [1.5, 1.5, .45], p: [1.0, 2.4, 1.35], e: [-1.2, 0, 4.2], c: '#3dd6e6',
        w: 'Moves frames between the LAN ports in hardware, so ordinary local traffic never burdens the CPU.',
        k: 'VLAN and bridge settings. If hardware offload is off, local traffic falls back to the CPU and slows down.' },
      { id: 'eth', n: 'Ethernet ports and magnetics', b: [5.6, 1.1, 1.0], p: [1.0, 3.6, 1.35], e: [0, 1.6, 6.6], c: '#9aa8c2',
        w: 'RJ45 sockets with isolation transformers. They negotiate speed and duplex with whatever is plugged in.',
        k: 'Link lights, cable test and negotiated speed. A link stuck at 100 Mbps usually means a bad cable or crimp.' },
      { id: 'cover', n: 'Top cover and status LEDs', b: [8, 5, .6], p: [0, 0, 2.4], e: [0, 0, 9.6], c: '#6c7e9f',
        w: 'Closes the box and shows power, link and activity on LEDs, the quickest health check there is.',
        k: 'LED pattern first, before any login. Steady link, blinking activity, no amber warning.' }
    ] },
    switch: { name: 'Managed PoE switch', short: 'LAN core', parts: [
      { id: 'base', n: 'Rack chassis', b: [10, 4.4, .5], p: [0, 0, 0], e: [0, 0, 0], c: '#5f7191',
        w: 'A 19-inch metal case that bolts into the rack and channels airflow from front to back.',
        k: 'Rack screws, clear vents and cable strain relief. Blocked airflow shortens a switch’s life.' },
      { id: 'psu', n: 'Power supply and PoE budget', b: [2.6, 2.0, .9], p: [.4, .4, .5], e: [-1.4, 1.6, 1.5], c: '#c9862e',
        w: 'Converts mains power for the electronics and supplies the PoE budget shared by all powered ports (cameras, phones, access points).',
        k: 'PoE budget. Adding one more camera than the budget allows makes ports drop or stay dark.' },
      { id: 'pcb', n: 'Mainboard (PCB)', b: [9.4, 3.8, .25], p: [.3, .3, 1.4], e: [0, 0, 3.0], c: '#2f8f6b',
        w: 'Connects the switching chip, management CPU, memory and every port circuit.',
        k: 'Board faults are replacement jobs; the configuration backup is what saves the time.' },
      { id: 'asic', n: 'Switching ASIC and heat sink', b: [2.2, 2.2, .7], p: [3.4, .9, 1.65], e: [0, 0, 5.0], c: '#4d8dff',
        w: 'Forwards frames at wire speed and keeps the MAC address table, the list of which device sits behind which port.',
        k: 'The MAC table when a device “disappears”: show it, find the port, then check cable and VLAN.' },
      { id: 'cpu', n: 'Management CPU and flash', b: [1.7, 1.7, .5], p: [6.2, 1.2, 1.65], e: [.8, 0, 4.2], c: '#8b9cff',
        w: 'A small processor that runs the web and command-line interface, VLAN and spanning-tree logic. It does not forward traffic.',
        k: 'Config backup and firmware version. A busy management CPU slows the admin page, not the network.' },
      { id: 'sfp', n: 'SFP+ uplink cages', b: [2.2, 1.2, .8], p: [7.2, 2.6, 1.65], e: [1.2, 1.2, 6.2], c: '#3dd6e6',
        w: 'Slots for fibre or direct-attach modules, used for fast uplinks between switches or to the router.',
        k: 'Module type and light levels. Mixed or unsupported modules are a common cause of “no link”.' },
      { id: 'ports', n: 'RJ45 PoE ports', b: [6.4, 1.1, 1.0], p: [.7, 3.0, 1.65], e: [0, 1.6, 6.6], c: '#9aa8c2',
        w: 'Copper ports that carry data and, on PoE ports, electrical power for powered devices over the same cable.',
        k: 'Port status, speed, PoE draw and errors. Rising CRC errors point to a bad cable.' },
      { id: 'cover', n: 'Top cover and vents', b: [10, 4.4, .5], p: [0, 0, 2.7], e: [0, 0, 9.4], c: '#6c7e9f',
        w: 'Protects the board and shapes the airflow; the front panel LEDs mirror port state.',
        k: 'Amber LEDs on a port, or a whole row dark, tell me where to start before opening the web page.' }
    ] },
    ap: { name: 'Wi-Fi access point', short: 'Wireless', parts: [
      { id: 'mount', n: 'Mounting plate', b: [6, 6, .4], p: [0, 0, 0], e: [0, 0, 0], c: '#5f7191',
        w: 'Fixes the unit to a ceiling or wall and sets its height, which matters as much as its settings for coverage.',
        k: 'Mount high and central, clear of metal. Coverage problems are often placement problems.' },
      { id: 'pd', n: 'PoE input and power regulation', b: [2.2, 1.8, .5], p: [.6, 3.6, .4], e: [-1.2, 1.2, 1.4], c: '#c9862e',
        w: 'Receives power and data over one network cable and converts it for the radios and processor.',
        k: 'The switch port’s PoE class and cable length. Weak PoE makes radios downshift or reboot.' },
      { id: 'pcb', n: 'Mainboard (PCB)', b: [5.2, 5.2, .22], p: [.4, .4, .85], e: [0, 0, 2.6], c: '#2f8f6b',
        w: 'Carries the processor, radios and the wired Ethernet connection.',
        k: 'Firmware version and uptime; frequent reboots usually trace back to power or firmware.' },
      { id: 'soc', n: 'SoC (controller CPU)', b: [1.8, 1.8, .6], p: [1.0, 1.2, 1.07], e: [-.8, 0, 4.4], c: '#4d8dff',
        w: 'Runs the access point software: client association, roaming, VLAN tagging and security.',
        k: 'Connected-client count. Too many clients on one AP is a capacity problem, not a signal problem.' },
      { id: 'radio', n: 'Wi-Fi radios (2.4 and 5 GHz)', b: [2.2, 1.4, .4], p: [3.0, 1.6, 1.07], e: [1.2, 0, 4.4], c: '#3dd6e6',
        w: 'Two radios: 2.4 GHz reaches further through walls, 5 GHz is faster over shorter range.',
        k: 'Channel and signal level. Neighbouring networks on the same channel are the usual cause of slow Wi-Fi.' },
      { id: 'ant', n: 'Antenna array', b: [4, .5, 1.1], p: [1.0, 4.5, 1.07], e: [0, 1.2, 6.4], c: '#8b9cff',
        w: 'Printed or internal antennas that shape where the signal goes; a ceiling unit radiates downward.',
        k: 'Orientation and obstructions. Do not hide it above a metal ceiling tile or inside a cabinet.' },
      { id: 'dome', n: 'Cover and status LED', b: [6, 6, .5], p: [0, 0, 2.3], e: [0, 0, 9.0], c: '#6c7e9f',
        w: 'The plastic cover is transparent to radio waves; the LED shows boot, ready and fault states.',
        k: 'The LED state, then the controller’s view of the device.' }
    ] },
    camera: { name: 'IP camera', short: 'CCTV', parts: [
      { id: 'base', n: 'Mount base and cable entry', b: [5, 5, .5], p: [0, 0, 0], e: [0, 0, 0], c: '#5f7191',
        w: 'Attaches to the ceiling or wall and holds the network cable. A weather seal keeps moisture out.',
        k: 'Seal and cable gland. Water in the housing kills more outdoor cameras than anything else.' },
      { id: 'pcb', n: 'Main board (SoC and memory)', b: [4.2, 4.2, .25], p: [.4, .4, .5], e: [0, 0, 1.8], c: '#2f8f6b',
        w: 'The processor compresses video (H.264 / H.265), runs the web server and speaks the network protocols.',
        k: 'Stream settings. Bitrate and frame rate decide both picture quality and how much storage you need.' },
      { id: 'sd', n: 'microSD slot', b: [1.0, 1.3, .2], p: [3.2, .6, .75], e: [1.2, -.8, 3.0], c: '#c9862e',
        w: 'Optional local recording, a safety net when the network to the recorder drops.',
        k: 'Card health and write endurance. Use cards rated for continuous recording.' },
      { id: 'sensor', n: 'Image sensor board', b: [2.2, 2.2, .3], p: [1.4, 1.4, .75], e: [0, 0, 3.8], c: '#4d8dff',
        w: 'Turns light into a digital image. A bigger sensor gathers more light, which helps at night.',
        k: 'Image quality at night and against bright windows (wide dynamic range).' },
      { id: 'lens', n: 'Lens assembly', b: [1.6, 1.6, 1.4], p: [1.7, 1.7, 1.05], e: [0, 0, 5.8], c: '#3dd6e6',
        w: 'Focuses the scene on the sensor. Focal length sets the field of view: short is wide, long is zoomed in.',
        k: 'Focus and field of view at install time. A dirty or fogged lens looks like a camera fault.' },
      { id: 'ir', n: 'Infrared LEDs', b: [.8, 3.4, .3], p: [.3, .8, 1.05], e: [-1.6, 0, 4.8], c: '#e0556b',
        w: 'Invisible light that lets the camera see in the dark. Black-and-white night mode is switched on by a light sensor.',
        k: 'Reflection from nearby walls or the dome glare. Mount away from surfaces that bounce IR back.' },
      { id: 'dome', n: 'Dome cover', b: [5, 5, .6], p: [0, 0, 2.5], e: [0, 0, 8.2], c: '#6c7e9f',
        w: 'A clear, impact-resistant dome that protects the lens and hides which way the camera points.',
        k: 'Scratches and condensation. Clean it as part of preventive maintenance.' }
    ] },
    pc: { name: 'Desktop PC', short: 'Workstation', parts: [
      { id: 'case', n: 'Case and chassis', b: [9, 6, .5], p: [0, 0, 0], e: [0, 0, 0], c: '#5f7191',
        w: 'The steel frame that holds every component, shields the electronics and guides airflow from the front fans to the rear.',
        k: 'Dust. A clogged filter or fan is the most common reason an office PC runs hot and slows down.' },
      { id: 'psu', n: 'Power supply (PSU)', b: [3, 2.6, 1.6], p: [.4, .4, .5], e: [-1.6, 1.6, 1.4], c: '#c9862e',
        w: 'Converts mains AC into the low DC voltages the board, drives and graphics card use, and protects them from surges.',
        k: 'Wattage headroom and age. An ageing supply causes random shutdowns under load.' },
      { id: 'drive', n: 'SSD / hard drive', b: [2.4, 1.6, .6], p: [.6, 3.6, .5], e: [-1.4, 1.2, 3.0], c: '#8b9cff',
        w: 'Permanent storage for the operating system and files. An SSD has no moving parts and boots in seconds.',
        k: 'SMART health and free space. A failing drive warns first: slow boots, freezes, clicking.' },
      { id: 'mobo', n: 'Motherboard', b: [7.6, 5.0, .25], p: [.6, .5, 2.1], e: [0, 0, 4.6], c: '#2f8f6b',
        w: 'The main circuit board that links the CPU, memory, storage, graphics and every port.',
        k: 'BIOS version and that the board sees all RAM and drives.' },
      { id: 'cpu', n: 'CPU and cooler', b: [2.2, 2.2, 1.2], p: [2.4, 1.2, 2.35], e: [0, 0, 7.0], c: '#4d8dff',
        w: 'The processor that runs every program, topped by a heat sink and fan that carry heat away.',
        k: 'Temperature and thermal paste. High idle temperatures usually mean a loose cooler or dried paste.' },
      { id: 'ram', n: 'Memory (RAM) sticks', b: [.5, 2.6, 1.0], p: [5.4, 1.2, 2.35], e: [1.4, -.6, 6.2], c: '#3dd6e6',
        w: 'Fast working memory for open programs. More RAM means more things open at once before the PC slows.',
        k: 'Reseat the sticks first if the PC beeps or will not start.' },
      { id: 'gpu', n: 'Graphics card', b: [4.6, 1.1, .8], p: [2.0, 3.4, 2.35], e: [-.4, 1.8, 8.4], c: '#e0556b',
        w: 'Draws the picture on the screen. Office PCs often use the graphics built into the CPU instead of a separate card.',
        k: 'Display cable and driver. Black screen with fans running often means a loose card or monitor input.' },
      { id: 'lid', n: 'Side panel and front fans', b: [9, 6, .5], p: [0, 0, 3.8], e: [0, 0, 11.0], c: '#6c7e9f',
        w: 'The removable panel gives access; fans pull cool air through the front and push warm air out the back.',
        k: 'Free space around the case. A PC pushed against a wall or inside a cupboard overheats.' }
    ] },
    laptop: { name: 'Laptop', short: 'Mobile', parts: [
      { id: 'base', n: 'Bottom case', b: [9, 6, .4], p: [0, 0, 0], e: [0, 0, 0], c: '#5f7191',
        w: 'The underside holds the rubber feet and vents, and has service hatches on many business models.',
        k: 'Vents on a soft surface cause overheating. A hard desk or a cooling stand helps.' },
      { id: 'batt', n: 'Battery', b: [5.2, 2.6, .5], p: [.8, 3.0, .4], e: [0, 1.6, 1.4], c: '#c9862e',
        w: 'A lithium-ion pack that powers the laptop away from a socket. It wears out with charge cycles.',
        k: 'Battery health report (powercfg /batteryreport). A swollen battery is replaced immediately.' },
      { id: 'mobo', n: 'Motherboard', b: [7.8, 2.6, .25], p: [.6, .4, .8], e: [0, 0, 3.0], c: '#2f8f6b',
        w: 'One compact board carries CPU, memory, ports and wireless. It is the most expensive part to replace.',
        k: 'Test with the charger only (battery removed) to separate board faults from battery faults.' },
      { id: 'cpu', n: 'CPU and cooling fan', b: [2.2, 2.0, .7], p: [4.6, .6, 1.05], e: [1.0, 0, 4.6], c: '#4d8dff',
        w: 'The processor and a small fan with a heat pipe that moves heat to the vents.',
        k: 'Fan noise and temperature. Cleaning the fan restores performance on many old laptops.' },
      { id: 'ssd', n: 'SSD and Wi-Fi card', b: [1.8, 1.0, .35], p: [1.2, .6, 1.05], e: [-1.0, 0, 4.6], c: '#8b9cff',
        w: 'The SSD stores everything; the small Wi-Fi card connects to wireless networks.',
        k: 'Drive health, and the Wi-Fi driver when the laptop cannot see networks.' },
      { id: 'deck', n: 'Keyboard and touchpad', b: [9, 5.4, .5], p: [0, 0, 1.4], e: [0, 0, 6.4], c: '#7d8fb3',
        w: 'The top deck with keys, touchpad and palm rests, wired to the board by thin ribbon cables.',
        k: 'Spilled drinks. Power off at once, then clean and dry before turning it on.' },
      { id: 'lid', n: 'Display lid and screen', b: [9, .45, 5.4], p: [0, 0, 1.9], e: [0, -1.6, 4.4], o: -50, c: '#4a5a78',
        w: 'The LCD panel with a webcam and antennas in the frame. The hinge carries the display cable.',
        k: 'Cracked panel or flicker is usually the screen cable at the hinge, not the board.' }
    ] },
    phone: { name: 'Mobile phone', short: 'Smartphone', parts: [
      { id: 'back', n: 'Back cover', b: [3.4, 6.8, .22], p: [0, 0, 0], e: [0, 0, 0], c: '#5f7191',
        w: 'Glass or polymer back. It holds the NFC and wireless-charging coils on many phones.',
        k: 'Cracks let in water. A case and screen protector are the cheapest repair plan.' },
      { id: 'batt', n: 'Battery', b: [2.8, 3.4, .3], p: [.3, .3, .22], e: [0, 0, 1.6], c: '#c9862e',
        w: 'A flat lithium-polymer cell that takes up about half of the phone’s volume.',
        k: 'Battery health in settings. Heat and full discharge cycles wear it fastest.' },
      { id: 'pcb', n: 'Mainboard', b: [2.8, 2.9, .2], p: [.3, 3.8, .22], e: [0, .6, 3.2], c: '#2f8f6b',
        w: 'A tiny board folded around the battery, carrying the processor, memory and radios.',
        k: 'Liquid damage shows on a small indicator inside the SIM tray.' },
      { id: 'soc', n: 'Chip (SoC) and modem', b: [1.4, 1.4, .3], p: [.9, 4.4, .42], e: [0, .4, 4.9], c: '#4d8dff',
        w: 'One chip that combines CPU, graphics, AI engine and the cellular modem and Wi-Fi radios.',
        k: 'Updates. System updates fix most speed and battery complaints.' },
      { id: 'cam', n: 'Camera module', b: [1.5, 1.5, .35], p: [1.6, 5.2, .42], e: [.4, 0, 6.4], c: '#3dd6e6',
        w: 'Lenses, a small image sensor and stabiliser. Phone cameras rely heavily on software processing.',
        k: 'Clean the lens first; most “blurry camera” faults are a smudge.' },
      { id: 'disp', n: 'Display panel', b: [3.2, 6.4, .2], p: [.1, .2, .75], e: [0, 0, 8.0], c: '#3b4a68',
        w: 'The OLED or LCD layer plus the touch sensor that reads your finger.',
        k: 'Ghost touches usually mean a damaged digitiser or a poor screen protector.' },
      { id: 'glass', n: 'Cover glass', b: [3.4, 6.8, .22], p: [0, 0, .95], e: [0, 0, 9.6], c: '#8c9ec2',
        w: 'Hardened glass that protects the display and forms the front of the phone.',
        k: 'Use a tempered-glass protector and avoid keeping keys in the same pocket.' }
    ] },
    server: { name: 'Rack server', short: 'Compute', parts: [
      { id: 'base', n: 'Chassis', b: [10, 5, .5], p: [0, 0, 0], e: [0, 0, 0], c: '#5f7191', w: 'A 1U steel case that bolts into the rack and guides cool air from the front fans to the back.', k: 'Rail fit and free airflow in front and behind. Blocked air shortens a server’s life.' },
      { id: 'psu', n: 'Redundant power supply', b: [2.6, 2.2, 1.0], p: [.4, .4, .5], e: [-1.4, 1.6, 1.4], c: '#c9862e', w: 'Converts mains power for the board. Servers usually carry two, so one can fail without downtime.', k: 'Both supplies lit and on separate power feeds (or a UPS).' },
      { id: 'drives', n: 'Drive bays', b: [5.2, 1.1, 1.0], p: [1.0, 3.7, .5], e: [0, 1.6, 3.0], c: '#8b9cff', w: 'Hot-swap slots for SSDs or hard disks, usually grouped in a RAID set.', k: 'Drive lights and RAID health. Replace a failed disk before a second one fails.' },
      { id: 'pcb', n: 'Mainboard', b: [9.2, 4.4, .25], p: [.4, .3, 1.5], e: [0, 0, 3.2], c: '#2f8f6b', w: 'Carries the CPU sockets, memory slots, storage controller and network ports.', k: 'Firmware and BIOS version, and that all memory and drives are detected.' },
      { id: 'cpu', n: 'CPU and heat sink', b: [2.2, 2.2, .9], p: [3.2, .8, 1.75], e: [0, 0, 5.4], c: '#4d8dff', w: 'The processor that runs every service, with a finned heat sink that carries heat to the airflow.', k: 'Temperature and load. High idle temperature means dust or dried thermal paste.' },
      { id: 'ram', n: 'Memory modules', b: [2.8, 1.6, .6], p: [6.2, .8, 1.75], e: [1.2, 0, 4.4], c: '#3dd6e6', w: 'Fast working memory. Servers use error-correcting (ECC) memory that repairs single-bit faults.', k: 'Memory errors in the log. A repeating error points to one bad stick.' },
      { id: 'cover', n: 'Top cover and fans', b: [10, 5, .5], p: [0, 0, 2.8], e: [0, 0, 9.6], c: '#6c7e9f', w: 'Closes the case and holds the fan wall that pulls air across the hot parts.', k: 'Fan speed and noise. A fan that stops causes thermal shutdown within minutes.' }
    ] },
    nvr: { name: 'NVR recorder', short: 'CCTV storage', parts: [
      { id: 'base', n: 'Chassis', b: [8, 5, .5], p: [0, 0, 0], e: [0, 0, 0], c: '#5f7191', w: 'A compact metal case that holds the disks and board and shields them from dust.', k: 'Ventilation. An NVR in a closed cupboard overheats and drops recordings.' },
      { id: 'psu', n: 'Power supply', b: [2.2, 1.6, .8], p: [.5, .5, .5], e: [-1.2, 1.4, 1.4], c: '#c9862e', w: 'Supplies the disks and board. Often an internal adapter with a small fan.', k: 'Stable power or a UPS. Power cuts are the main cause of corrupted recordings.' },
      { id: 'disks', n: 'Surveillance disks', b: [5.4, 2.2, 1.0], p: [1.0, 2.2, .5], e: [0, 1.4, 3.0], c: '#8b9cff', w: 'Hard disks built for constant writing, storing every camera’s video for the retention period.', k: 'Disk health and free space. Retention days = disk space ÷ daily recording size.' },
      { id: 'pcb', n: 'Mainboard', b: [7.2, 4.2, .25], p: [.4, .4, 1.5], e: [0, 0, 3.2], c: '#2f8f6b', w: 'Joins the video processor, memory and the PoE or network ports for the cameras.', k: 'Firmware version. Updates fix many playback and camera-compatibility faults.' },
      { id: 'soc', n: 'Video processor', b: [2.0, 2.0, .7], p: [2.8, 1.0, 1.75], e: [0, 0, 5.2], c: '#4d8dff', w: 'Decodes and records many camera streams at once and serves live view to apps.', k: 'CPU load and the stream settings. Too many high-bitrate cameras overload it.' },
      { id: 'cover', n: 'Top cover and LEDs', b: [8, 5, .6], p: [0, 0, 2.8], e: [0, 0, 9.2], c: '#6c7e9f', w: 'The front LEDs show power, network and disk activity.', k: 'A blinking disk LED means it is recording. Steady or dark is a reason to investigate.' }
    ] },
    ups: { name: 'UPS', short: 'Power backup', parts: [
      { id: 'base', n: 'Housing base', b: [5, 4.6, .5], p: [0, 0, 0], e: [0, 0, 0], c: '#5f7191', w: 'The sturdy base that carries the heavy batteries.', k: 'Place it on a hard, level surface with air space around it.' },
      { id: 'batt', n: 'Battery pack', b: [4.2, 3.4, 2.4], p: [.4, .3, .5], e: [0, 0, 2.0], c: '#c9862e', w: 'Sealed lead-acid or lithium cells that keep devices running during a power cut.', k: 'Battery age. They last three to five years; test runtime yearly.' },
      { id: 'inv', n: 'Inverter board', b: [4.2, 3.2, .3], p: [.4, .4, 2.9], e: [0, 0, 3.6], c: '#2f8f6b', w: 'Turns battery DC back into clean AC and switches over in milliseconds.', k: 'Self-test result and any overload alarm.' },
      { id: 'trans', n: 'Transformer', b: [2.0, 2.0, 1.3], p: [.8, .8, 3.2], e: [0, 0, 5.2], c: '#4d8dff', w: 'Steps the voltage up or down and smooths sags and surges from the supply.', k: 'Heat and humming. A hot, loud transformer means overload.' },
      { id: 'panel', n: 'Display panel', b: [3.2, .6, 1.3], p: [.9, 3.7, .6], e: [0, 1.8, 2.6], c: '#8b9cff', w: 'Shows load, battery level and alarms.', k: 'Load percentage. Stay under about 80 percent for headroom.' },
      { id: 'cover', n: 'Top cover', b: [5, 4.6, .5], p: [0, 0, 4.6], e: [0, 0, 8.4], c: '#6c7e9f', w: 'Encloses everything and vents heat.', k: 'Keep the vents clear.' }
    ] },
    printer: { name: 'Office printer', short: 'Print and scan', parts: [
      { id: 'tray', n: 'Paper tray and base', b: [8, 6, .9], p: [0, 0, 0], e: [0, 0, 0], c: '#5f7191', w: 'Holds the paper stack and feeds one sheet at a time.', k: 'Paper type and tray guides. Most paper jams are the wrong paper or a loose guide.' },
      { id: 'toner', n: 'Toner cartridge', b: [2.6, 2.4, 1.3], p: [.6, .8, .9], e: [-1.4, 1.2, 2.8], c: '#e0556b', w: 'Holds the powder that is fused to the page to make the print.', k: 'Toner level, and use matching cartridges to avoid streaks.' },
      { id: 'fuser', n: 'Fuser unit', b: [3.6, 2.4, 1.3], p: [3.8, .8, .9], e: [1.2, 1.2, 2.8], c: '#c9862e', w: 'Heated rollers that melt toner into the paper.', k: 'Smeared prints or wrinkles point to a worn fuser. Let it cool before touching.' },
      { id: 'feed', n: 'Feed rollers', b: [7, 1.2, .7], p: [.5, 3.8, .9], e: [0, 1.6, 4.6], c: '#8b9cff', w: 'Rubber rollers that pull paper from the tray into the machine.', k: 'Clean or replace glazed rollers when it pulls two sheets or none.' },
      { id: 'scan', n: 'Scanner bed and feeder', b: [8, 6, .9], p: [0, 0, 2.4], e: [0, 0, 7.4], c: '#6c7e9f', w: 'A glass scanner bed with an automatic feeder that copies and scans documents.', k: 'Clean the glass. Streaks on every copy are usually a dirty strip.' }
    ] },
    onu: { name: 'Fibre modem (ONU)', short: 'ISP link', parts: [
      { id: 'base', n: 'Base', b: [5, 4, .4], p: [0, 0, 0], e: [0, 0, 0], c: '#5f7191', w: 'Holds the board and stands or wall-mounts the unit.', k: 'Keep it cool and away from the router’s Wi-Fi.' },
      { id: 'pcb', n: 'Mainboard', b: [4.4, 3.4, .22], p: [.3, .3, .4], e: [0, 0, 1.8], c: '#2f8f6b', w: 'Joins the optical module, processor and Ethernet ports.', k: 'Reboot only after checking the lights; many ISPs lock the config.' },
      { id: 'optic', n: 'Optical module', b: [2.2, 1.0, .6], p: [.6, 2.4, .62], e: [0, 1.6, 3.2], c: '#3dd6e6', w: 'Converts light pulses on the fibre into electrical data and back.', k: 'The PON and LOS lights. A red LOS light means no light from the street: check the fibre.' },
      { id: 'soc', n: 'Processor', b: [1.6, 1.6, .5], p: [2.8, 1.0, .62], e: [0, 0, 4.2], c: '#4d8dff', w: 'Handles the connection to the ISP and passes traffic to your router.', k: 'Firmware is managed by the ISP; report persistent faults to them.' },
      { id: 'cover', n: 'Cover and LEDs', b: [5, 4, .9], p: [0, 0, 1.4], e: [0, 0, 6.8], c: '#6c7e9f', w: 'The case with LEDs for power, PON, LOS and LAN.', k: 'Read the LEDs first: PON steady, LOS off, LAN blinking.' }
    ] }
  };

  /* ---------- surface details (ports, vents, LEDs, lenses) ---------- */
  const DECOS = {
    router: { eth: [{ f: 'L', n: 5, a: [.06, .94], b: [.18, .72], c: '#0a101e' }], cover: [{ f: 'T', n: 7, a: [.18, .82], b: [.2, .8], c: '#0a101e' }, { f: 'L', n: 4, a: [.06, .32], b: [.3, .6], c: '#4fd39d' }] },
    switch: { ports: [{ f: 'L', n: 12, a: [.04, .96], b: [.2, .75], c: '#0a101e' }], sfp: [{ f: 'L', n: 2, a: [.08, .92], b: [.25, .7], c: '#0a101e' }], cover: [{ f: 'T', n: 9, a: [.12, .88], b: [.18, .82], c: '#0a101e' }, { f: 'L', n: 6, a: [.04, .3], b: [.3, .6], c: '#4fd39d' }] },
    ap: { dome: [{ f: 'T', n: 1, a: [.42, .58], b: [.42, .58], c: '#4fd39d' }], ant: [{ f: 'T', n: 3, a: [.1, .9], b: [.2, .8], c: '#0a101e' }] },
    camera: { lens: [{ f: 'T', n: 1, a: [.18, .82], b: [.18, .82], c: '#06090f' }], ir: [{ f: 'T', n: 5, a: [.2, .8], b: [.1, .9], c: '#f2b0b8' }], sd: [{ f: 'T', n: 1, a: [.2, .8], b: [.15, .85], c: '#0a101e' }], dome: [{ f: 'T', n: 1, a: [.3, .7], b: [.3, .7], c: '#10192e' }] },
    pc: { cpu: [{ f: 'T', n: 4, a: [.12, .88], b: [.12, .88], c: '#0a101e' }], gpu: [{ f: 'L', n: 3, a: [.1, .9], b: [.2, .8], c: '#0a101e' }], lid: [{ f: 'T', n: 6, a: [.12, .88], b: [.2, .8], c: '#0a101e' }, { f: 'L', n: 2, a: [.05, .2], b: [.3, .6], c: '#4fd39d' }], ram: [{ f: 'R', n: 1, a: [.1, .9], b: [.3, .8], c: '#0a101e' }] },
    laptop: { deck: [{ f: 'T', n: 12, a: [.06, .94], b: [.08, .5], c: '#0a101e' }, { f: 'T', n: 1, a: [.36, .64], b: [.62, .92], c: '#1a2540' }], lid: [{ f: 'L', n: 1, a: [.05, .95], b: [.06, .94], c: '#0a1224' }], cpu: [{ f: 'T', n: 1, a: [.2, .8], b: [.2, .8], c: '#0a101e' }] },
    server: { drives: [{ f: 'L', n: 6, a: [.05, .95], b: [.2, .8], c: '#0a101e' }], cpu: [{ f: 'T', n: 5, a: [.12, .88], b: [.1, .9], c: '#0a101e' }], ram: [{ f: 'T', n: 4, a: [.08, .92], b: [.15, .85], c: '#0a101e' }], cover: [{ f: 'T', n: 9, a: [.1, .9], b: [.15, .85], c: '#0a101e' }, { f: 'L', n: 3, a: [.04, .2], b: [.3, .6], c: '#4fd39d' }] },
    nvr: { disks: [{ f: 'T', n: 2, a: [.06, .94], b: [.12, .88], c: '#0a101e' }], soc: [{ f: 'T', n: 3, a: [.15, .85], b: [.15, .85], c: '#0a101e' }], cover: [{ f: 'T', n: 7, a: [.12, .88], b: [.2, .8], c: '#0a101e' }, { f: 'L', n: 4, a: [.05, .3], b: [.3, .6], c: '#4fd39d' }] },
    ups: { trans: [{ f: 'T', n: 4, a: [.12, .88], b: [.12, .88], c: '#0a101e' }], panel: [{ f: 'L', n: 3, a: [.08, .5], b: [.3, .7], c: '#4fd39d' }, { f: 'L', n: 1, a: [.56, .94], b: [.25, .75], c: '#0a101e' }], cover: [{ f: 'T', n: 6, a: [.15, .85], b: [.2, .8], c: '#0a101e' }] },
    printer: { tray: [{ f: 'L', n: 1, a: [.1, .9], b: [.35, .6], c: '#0a101e' }], feed: [{ f: 'L', n: 4, a: [.04, .96], b: [.25, .75], c: '#0a101e' }], scan: [{ f: 'T', n: 1, a: [.08, .92], b: [.1, .9], c: '#0a101e' }, { f: 'L', n: 1, a: [.75, .92], b: [.3, .7], c: '#4fd39d' }] },
    onu: { optic: [{ f: 'L', n: 1, a: [.2, .8], b: [.25, .75], c: '#0a101e' }], cover: [{ f: 'T', n: 4, a: [.15, .85], b: [.3, .7], c: '#4fd39d' }, { f: 'L', n: 3, a: [.1, .4], b: [.3, .7], c: '#4d8dff' }] },
    phone: { glass: [{ f: 'T', n: 1, a: [.07, .93], b: [.04, .96], c: '#0a1224' }], cam: [{ f: 'T', n: 2, a: [.15, .85], b: [.15, .85], c: '#06090f' }], disp: [{ f: 'T', n: 1, a: [.04, .96], b: [.03, .97], c: '#16213a' }] }
  };
  Object.keys(DECOS).forEach(k => DEVICES[k].parts.forEach(pt => { if (DECOS[k][pt.id]) pt.d = DECOS[k][pt.id]; }));

  /* ---------- geometry ---------- */
  const proj = (x, y, z) => [(x - y) * C, (x + y) * H - z];
  const hexRGB = (h) => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
  const shade = (hex, f) => {
    const [r, g, b] = hexRGB(hex);
    const m = (v) => Math.round(f < 1 ? v * f : v + (255 - v) * (f - 1));
    return `rgb(${m(r)},${m(g)},${m(b)})`;
  };
  const pts = (a, s, ox, oy) => a.map(([x, y]) => (x * s + ox).toFixed(1) + ',' + (y * s + oy).toFixed(1)).join(' ');
  const cur = (pt, t) => [pt.p[0] + pt.e[0] * t, pt.p[1] + pt.e[1] * t, pt.p[2] + pt.e[2] * t];

  function fit(dev, W, Hh, padR, ts) {
    let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9;
    dev.parts.forEach(pt => (ts || [0, 1]).forEach(t => {
      const [x, y, z] = cur(pt, t), [w, d, h] = pt.b;
      [[x, y, z], [x + w, y, z], [x, y + d, z], [x + w, y + d, z], [x, y, z + h], [x + w, y, z + h], [x, y + d, z + h], [x + w, y + d, z + h]]
        .forEach(v => { const q = proj(...v); x0 = Math.min(x0, q[0]); x1 = Math.max(x1, q[0]); y0 = Math.min(y0, q[1]); y1 = Math.max(y1, q[1]); });
    }));
    const s = Math.min((W - padR - 24) / (x1 - x0), (Hh - 24) / (y1 - y0));
    return { s, ox: 12 - x0 * s + ((W - padR - 24) - (x1 - x0) * s) / 2, oy: 12 - y0 * s + ((Hh - 24) - (y1 - y0) * s) / 2, right: 12 + (x1 - x0) * s + ((W - padR - 24) - (x1 - x0) * s) / 2 };
  }

  /* ---------- one drawable device ---------- */
  function createModel(svg, key, opt) {
    const dev = DEVICES[key];
    const W = opt.w, Hh = opt.h, padR = opt.labels ? 230 : 0;
    const f = fit(dev, W, Hh, padR, opt.fitT);
    svg.setAttribute('viewBox', `0 0 ${W} ${Hh}`);
    svg.textContent = '';
    const mk = (tag, attrs) => { const n = document.createElementNS(NS, tag); for (const k in attrs) n.setAttribute(k, attrs[k]); return n; };
    const gLead = mk('g', { 'class': 'dx-leads' }), gParts = mk('g', {}), gLab = mk('g', { 'class': 'dx-labels' });
    svg.append(gLead, gParts, gLab);
    const items = dev.parts.map(pt => {
      const g = mk('g', { 'class': 'dx-part', 'data-id': pt.id, tabindex: opt.interactive ? '0' : '-1' });
      if (opt.interactive) { g.setAttribute('role', 'button'); g.setAttribute('aria-label', pt.n); }
      const top = mk('polygon', { 'class': 'dx-f-top' }), left = mk('polygon', { 'class': 'dx-f-left' }), right = mk('polygon', { 'class': 'dx-f-right' });
      g.append(left, right, top);
      const decos = [];
      (pt.d || []).forEach(dc => {
        const cell = (1 - 0) / dc.n, polys = [];
        for (let i = 0; i < dc.n; i++) { const q = mk('polygon', dc.c === '#0a101e' ? { 'class': 'dx-deco' } : { 'class': 'dx-deco dx-led', fill: dc.c }); g.append(q); polys.push(q); }
        decos.push({ dc, polys, cell });
      });
      const lead = mk('line', { 'class': 'dx-lead' });
      gLead.append(lead);
      let lab = null, con = null;
      if (opt.labels) {
        con = mk('polyline', { 'class': 'dx-con', fill: 'none' });
        gLab.append(con);
        lab = mk('text', { 'class': 'dx-lab', 'text-anchor': 'start' });
        lab.textContent = pt.n;
        gLab.append(lab);
      }
      return { pt, g, top, left, right, lead, lab, con, decos };
    });
    let order = '';
    function render(t, active) {
      const sorted = items.map(it => { const [x, y, z] = cur(it.pt, t); return { it, k: z * 3 + (x + y) * .9 + it.pt.b[2] * .2 + (it.pt.o || 0) }; })
        .sort((a, b) => a.k - b.k);
      const o = sorted.map(s => s.it.pt.id).join();
      if (o !== order) { order = o; sorted.forEach(s => gParts.append(s.it.g)); }
      items.forEach(it => {
        const [x, y, z] = cur(it.pt, t), [w, d, h] = it.pt.b;
        const P = (a, b, c) => proj(a, b, c);
        it.top.setAttribute('points', pts([P(x, y, z + h), P(x + w, y, z + h), P(x + w, y + d, z + h), P(x, y + d, z + h)], f.s, f.ox, f.oy));
        it.left.setAttribute('points', pts([P(x, y + d, z + h), P(x + w, y + d, z + h), P(x + w, y + d, z), P(x, y + d, z)], f.s, f.ox, f.oy));
        it.right.setAttribute('points', pts([P(x + w, y, z + h), P(x + w, y + d, z + h), P(x + w, y + d, z), P(x + w, y, z)], f.s, f.ox, f.oy));
        it.decos.forEach(({ dc, polys }) => {
          const n = polys.length, span = dc.a[1] - dc.a[0], step = span / n, gap = Math.min(step * .28, .05);
          polys.forEach((q, i) => {
            const u0 = dc.a[0] + step * i + gap / 2, u1 = dc.a[0] + step * (i + 1) - gap / 2, v0 = dc.b[0], v1 = dc.b[1];
            let c;
            if (dc.f === 'T') { const X0 = x + w * u0, X1 = x + w * u1, Y0 = y + d * v0, Y1 = y + d * v1, Z = z + h + .01; c = [P(X0, Y0, Z), P(X1, Y0, Z), P(X1, Y1, Z), P(X0, Y1, Z)]; }
            else if (dc.f === 'L') { const X0 = x + w * u0, X1 = x + w * u1, Y = y + d + .01, Z0 = z + h * (1 - v1), Z1 = z + h * (1 - v0); c = [P(X0, Y, Z1), P(X1, Y, Z1), P(X1, Y, Z0), P(X0, Y, Z0)]; }
            else { const Y0 = y + d * u0, Y1 = y + d * u1, X = x + w + .01, Z0 = z + h * (1 - v1), Z1 = z + h * (1 - v0); c = [P(X, Y0, Z1), P(X, Y1, Z1), P(X, Y1, Z0), P(X, Y0, Z0)]; }
            q.setAttribute('points', pts(c, f.s, f.ox, f.oy));
          });
        });
        const c0 = proj(it.pt.p[0] + w / 2, it.pt.p[1] + d / 2, it.pt.p[2] + h / 2), c1 = proj(x + w / 2, y + d / 2, z + h / 2);
        it.lead.setAttribute('x1', (c0[0] * f.s + f.ox).toFixed(1)); it.lead.setAttribute('y1', (c0[1] * f.s + f.oy).toFixed(1));
        it.lead.setAttribute('x2', (c1[0] * f.s + f.ox).toFixed(1)); it.lead.setAttribute('y2', (c1[1] * f.s + f.oy).toFixed(1));
        it.lead.style.opacity = (clamp(t * 3) * .5).toFixed(2);
        it.g.classList.toggle('is-on', active === it.pt.id);
        it.g.classList.toggle('is-dim', !!active && active !== it.pt.id);
      });
      if (opt.labels) {
        /* labels sit in a right-hand column, spaced so they never overlap */
        const want = items.map(it => { const [x, y, z] = cur(it.pt, t), [w, d, h] = it.pt.b; const c1 = proj(x + w / 2, y + d / 2, z + h / 2); const r = proj(x + w, y + d / 2, z + h / 2); return { it, y: c1[1] * f.s + f.oy, rx: r[0] * f.s + f.ox, ry: r[1] * f.s + f.oy }; }).sort((a, b) => a.y - b.y);
        const GAP = 21; for (let i = 1; i < want.length; i++) want[i].ly = Math.max(want[i].y, (want[i - 1].ly ?? want[i - 1].y) + GAP); want[0].ly = want[0].y;
        const over = want[want.length - 1].ly - (Hh - 14); if (over > 0) want.forEach(w => w.ly -= over);
        const op = clamp((t - .2) * 3).toFixed(2), lx = f.right + 26;
        want.forEach(w => {
          w.it.lab.setAttribute('x', lx.toFixed(1)); w.it.lab.setAttribute('y', (w.ly + 5).toFixed(1)); w.it.lab.style.opacity = op;
          w.it.lab.classList.toggle('is-on', active === w.it.pt.id);
          w.it.con.setAttribute('points', `${w.rx.toFixed(1)},${w.ry.toFixed(1)} ${(lx - 14).toFixed(1)},${w.ly.toFixed(1)} ${(lx - 5).toFixed(1)},${w.ly.toFixed(1)}`);
          w.it.con.style.opacity = (op * .8).toFixed(2); w.it.con.classList.toggle('is-on', active === w.it.pt.id);
        });
      }
    }
    return { items, render, dev };
  }

  /* ---------- Device Explorer section ---------- */
  function initExplorer() {
    const tabs = document.getElementById('dx-tabs'), svg = document.getElementById('dx-svg'),
      panel = document.getElementById('dx-panel'), range = document.getElementById('dx-range'),
      list = document.getElementById('dx-parts'), stage = document.getElementById('dx-stage');
    if (!tabs || !svg || !panel || !range || !list) return;
    let key = 'router', t = 0, active = null, model = null, touched = false, pinned = null;

    const setPanel = (id) => {
      const pt = id && DEVICES[key].parts.find(p => p.id === id);
      panel.classList.toggle('is-idle', !pt);
      panel.innerHTML = '';
      if (!pt) { const h = document.createElement('p'); h.className = 'dx-hint'; h.textContent = L.exHint; panel.append(h); return; }
      const h = document.createElement('h3'); h.textContent = pt.n;
      const a = document.createElement('p'); a.innerHTML = '<b></b> '; a.firstChild.textContent = L.exWhat; a.append(pt.w);
      const b = document.createElement('p'); b.innerHTML = '<b></b> '; b.firstChild.textContent = L.exCheck; b.append(pt.k);
      panel.append(h, a, b);
    };
    const setActive = (id) => { active = id; setPanel(id); model.render(t, active); list.querySelectorAll('button').forEach(bt => bt.classList.toggle('is-on', bt.dataset.id === id)); };
    const setT = (v) => { t = clamp(v); range.value = Math.round(t * 100); range.style.setProperty('--p', Math.round(t * 100) + '%'); model.render(t, active); };

    function build() {
      model = createModel(svg, key, { w: 760, h: 520, labels: true, interactive: true });
      list.textContent = '';
      DEVICES[key].parts.slice().reverse().forEach(pt => {
        const li = document.createElement('li'), bt = document.createElement('button');
        bt.type = 'button'; bt.dataset.id = pt.id; bt.textContent = pt.n;
        bt.addEventListener('mouseenter', () => setActive(pt.id));
        bt.addEventListener('focus', () => setActive(pt.id));
        bt.addEventListener('mouseleave', () => setActive(pinned));
        bt.addEventListener('click', () => { pinned = pt.id; setActive(pt.id); });
        li.append(bt); list.append(li);
      });
      model.items.forEach(it => {
        it.g.addEventListener('mouseenter', () => setActive(it.pt.id));
        it.g.addEventListener('focus', () => setActive(it.pt.id));
        it.g.addEventListener('click', () => { pinned = it.pt.id; setActive(it.pt.id); });
      });
      svg.onmouseleave = () => setActive(pinned);
      active = null; pinned = null; setPanel(null); model.render(t, null);
      svg.setAttribute('aria-label', DEVICES[key].name + ': ' + L.exBar);
    }

    Object.keys(DEVICES).forEach((k, i, arr) => {
      const b = document.createElement('button');
      b.type = 'button'; b.setAttribute('role', 'tab'); b.id = 'dx-tab-' + k; b.setAttribute('aria-selected', k === key ? 'true' : 'false'); b.tabIndex = k === key ? 0 : -1;
      b.innerHTML = '<span></span><small></small>'; b.firstChild.textContent = DEVICES[k].name; b.lastChild.textContent = DEVICES[k].short;
      b.addEventListener('click', () => select(k));
      b.addEventListener('keydown', (e) => {
        const d = e.key === 'ArrowDown' || e.key === 'ArrowRight' ? 1 : e.key === 'ArrowUp' || e.key === 'ArrowLeft' ? -1 : 0;
        if (!d) return; e.preventDefault();
        const n = arr[(i + d + arr.length) % arr.length]; select(n); document.getElementById('dx-tab-' + n).focus();
      });
      tabs.append(b);
    });
    function select(k) {
      key = k; tabs.querySelectorAll('button').forEach(b => { const on = b.id === 'dx-tab-' + k; b.setAttribute('aria-selected', on); b.tabIndex = on ? 0 : -1; });
      build();
    }
    range.addEventListener('input', () => { touched = true; setT(range.value / 100); });
    build(); setT(0);

    /* gentle first-view hint: open to ~40% once, unless the visitor already used the bar */
    if (!reduce.matches && 'IntersectionObserver' in window) {
      const io = new IntersectionObserver((en) => {
        if (!en[0].isIntersecting) return; io.disconnect();
        if (touched) return;
        const t0 = performance.now();
        (function step(now) { if (touched) return; const p = clamp((now - t0) / 1400); setT(ease(p) * .42); if (p < 1) requestAnimationFrame(step); })(t0);
      }, { threshold: .45 });
      io.observe(stage || svg);
    }
  }

  /* ---------- Decorative devices further down the page: they open up as you scroll past ---------- */
  function initFloaters() {
    const els = document.querySelectorAll('[data-dx-float]');
    if (!els.length || !matchMedia('(min-width: 1100px)').matches) return;
    const items = [...els].map(el => {
      const svg = document.createElementNS(NS, 'svg'); svg.setAttribute('aria-hidden', 'true'); svg.setAttribute('focusable', 'false'); el.append(svg);
      const m = createModel(svg, el.dataset.dxFloat, { w: 560, h: 440, labels: false, interactive: false, fitT: [0, .95] }); m.render(0, null);
      return { el, m, t: -1 };
    });
    const vis = new Set(); let raf = 0;
    const io = new IntersectionObserver(en => en.forEach(e => { if (e.isIntersecting) vis.add(e.target); else vis.delete(e.target); }), { rootMargin: '120px' });
    items.forEach(i => io.observe(i.el));
    const upd = () => {
      raf = 0; const vh = innerHeight;
      items.forEach(i => {
        if (!vis.has(i.el)) return;
        const r = i.el.getBoundingClientRect(), p = clamp((vh * .92 - r.top) / (vh * .75)), t = reduce.matches ? .3 : ease(p) * .95;
        if (Math.abs(t - i.t) > .004) { i.t = t; i.m.render(t, null); }
      });
    };
    addEventListener('scroll', () => { if (!raf) raf = requestAnimationFrame(upd); }, { passive: true }); upd();
  }

  /* ---------- Hero objects: assemble from dust, turn to dust on hover, explode and vanish on scroll ---------- */
  function initHero() {
    const host = document.querySelector('.hero-visual');
    if (!host || !matchMedia('(min-width: 901px)').matches) return;
    const spec = [['pc', 'ho-a', 760, 520, 1100], ['laptop', 'ho-b', 760, 520, 1100], ['router', 'ho-c', 760, 520, 1100]];
    const dpr = Math.min(devicePixelRatio || 1, 1.25);
    const objs = spec.map(([k, cls, w, h, count]) => {
      const wrap = document.createElement('div'); wrap.className = 'hero-obj ' + cls;
      const svg = document.createElementNS(NS, 'svg'); svg.setAttribute('aria-hidden', 'true'); svg.setAttribute('focusable', 'false');
      const cv = document.createElement('canvas'); cv.setAttribute('aria-hidden', 'true');
      wrap.append(svg, cv); host.append(wrap);
      const m = createModel(svg, k, { w, h, labels: false, interactive: false, fitT: [0, .5] });
      m.render(0, null);
      /* sample dust particles from the assembled faces (area-weighted) */
      const tris = []; let area = 0, bx0 = 1e9, bx1 = -1e9, by0 = 1e9, by1 = -1e9;
      m.items.forEach(it => [it.left, it.right, it.top].concat(it.decos.flatMap(d => d.polys)).forEach(poly => {
        const v = poly.getAttribute('points').split(' ').map(q => q.split(',').map(Number)), col = getComputedStyle(poly).fill || '#5a8dff';
        v.forEach(([x, y]) => { bx0 = Math.min(bx0, x); bx1 = Math.max(bx1, x); by0 = Math.min(by0, y); by1 = Math.max(by1, y); });
        [[v[0], v[1], v[2]], [v[0], v[2], v[3]]].forEach(t => { const ar = Math.abs((t[1][0] - t[0][0]) * (t[2][1] - t[0][1]) - (t[2][0] - t[0][0]) * (t[1][1] - t[0][1])) / 2; if (ar > 0) { tris.push({ t, ar, col }); area += ar; } });
      }));
      const parts = [];
      tris.forEach(tr => { const n = Math.max(1, Math.round(count * tr.ar / area)); for (let i = 0; i < n; i++) {
        let r1 = Math.random(), r2 = Math.random(); if (r1 + r2 > 1) { r1 = 1 - r1; r2 = 1 - r2; }
        const [A, B, C] = tr.t, hx = A[0] + r1 * (B[0] - A[0]) + r2 * (C[0] - A[0]), hy = A[1] + r1 * (B[1] - A[1]) + r2 * (C[1] - A[1]), a = Math.random() * 6.283, dist = 50 + Math.random() * 190;
        parts.push({ hx, hy, vx: Math.cos(a) * dist, vy: Math.sin(a) * dist * .7 - 40 - Math.random() * 70, e: 1, del: Math.random() * .28 + (hx - bx0) / (bx1 - bx0 + 1) * .22, rate: .6 + Math.random() * 1.1, ph: Math.random() * 6.283, sz: .9 + Math.random() * 1.5, col: tr.col, tm: 0 });
      } });
      return { wrap, svg, cv, ctx: cv.getContext('2d'), m, parts, w, h, t: 0, dust: false, formed: false, box: [bx0, by0, bx1, by1] };
    });
    let prog = 0, raf = 0, last = 0, clock = 0;
    const size = () => objs.forEach(o => { const r = o.wrap.getBoundingClientRect(); o.cv.width = Math.round(r.width * dpr); o.cv.height = Math.round(r.height * dpr); o.sc = o.cv.width / o.w; });
    const draw = (o, dt) => {
      const { ctx, cv, parts } = o; ctx.clearRect(0, 0, cv.width, cv.height);
      let moving = false;
      for (const q of parts) {
        const goal = o.dust ? 1 : 0;
        if (goal === 1) { q.tm += dt; if (q.tm > q.del) q.e = Math.min(1, q.e + dt * q.rate * 1.5); }
        else { q.tm = 0; q.e = Math.max(0, q.e - dt * q.rate * 1.1); }
        if (q.e > 0 && q.e < 1) moving = true; else if (q.e === 1 && goal === 0) moving = true;
        const E = 1 - Math.pow(1 - q.e, 3), wob = Math.sin(clock * 3 + q.ph) * 4 * E;
        const x = q.hx + q.vx * E + wob, y = q.hy + q.vy * E - E * E * 40;
        ctx.globalAlpha = 1 - .65 * E; ctx.fillStyle = q.col;
        const z = q.sz * o.sc * (1 - .45 * E); ctx.fillRect(x * o.sc, y * o.sc, z, z);
      }
      ctx.globalAlpha = 1; return moving || o.dust;
    };
    const loop = (now) => {
      raf = 0; const dt = Math.min(.1, (now - (last || now)) / 1000); last = now; clock += dt; let busy = false;
      objs.forEach(o => {
        const want = reduce.matches ? 0 : (prog < .12 && o.hover);
        o.dust = !!want;
        const d = prog - o.t; o.t = reduce.matches ? prog : (Math.abs(d) < .002 ? prog : o.t + d * .14);
        if (Math.abs(prog - o.t) > .002) busy = true;
        if (o.t > .004 || !o.formed) o.m.render(o.t, null);
        const moving = draw(o, dt); if (moving) busy = true;
        const resting = !moving && !o.dust;
        o.svg.style.opacity = resting ? '1' : '0'; o.cv.style.opacity = resting ? '0' : '1';
        o.wrap.style.opacity = (1 - clamp((prog - .45) / .5)).toFixed(3);
        o.wrap.style.transform = `translateY(${(-prog * 36).toFixed(1)}px)`;
      });
      if (busy) raf = requestAnimationFrame(loop);
    };
    const kick = () => { if (!raf) { last = 0; raf = requestAnimationFrame(loop); } };
    size(); addEventListener('resize', () => { size(); kick(); });
    /* hit test against each object's footprint so empty space does not trigger it */
    host.addEventListener('mousemove', (ev) => {
      let any = false;
      objs.slice().reverse().forEach(o => {
        const r = o.wrap.getBoundingClientRect(), k = r.width / o.w, x = (ev.clientX - r.left) / k, y = (ev.clientY - r.top) / k;
        const inside = !any && x > o.box[0] - 6 && x < o.box[2] + 6 && y > o.box[1] - 6 && y < o.box[3] + 6;
        if (inside) any = true; if (inside !== !!o.hover) { o.hover = inside; kick(); }
      });
    });
    host.addEventListener('mouseleave', () => { objs.forEach(o => { if (o.hover) { o.hover = false; kick(); } }); });
    const onScroll = () => { const hero = host.closest('.hero') || host; const p = clamp(scrollY / (hero.offsetHeight * .8)); if (p !== prog) { prog = p; kick(); } };
    addEventListener('scroll', onScroll, { passive: true }); onScroll();
    /* entrance: the devices assemble out of dust (instant when reduced motion is on) */
    if (reduce.matches) objs.forEach(o => o.parts.forEach(q => q.e = 0));
    objs.forEach((o, i) => { o.formed = true; setTimeout(kick, 120 + i * 180); }); kick();
  }

  const start = () => { initExplorer(); initHero(); initFloaters(); };
  if (document.readyState !== 'loading') start(); else document.addEventListener('DOMContentLoaded', start);
})();
