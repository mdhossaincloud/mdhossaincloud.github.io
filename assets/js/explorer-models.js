/* Real 3D models for the Device Explorer (v4.6). Optimised copies in assets/models/.
   Credits (all CC BY 4.0, via Sketchfab), also shown on the page:
   CCTV by movahed; MacBook Laptop by Issac Ghazanfar; Dream Computer Setup by Daniel Cardona; Low Poly Mobile Phone by k.
   Changes: compressed (Meshopt/WebP), simplified, re-centred, and parts moved apart for the exploded view.
   "dir" is how far (in model units, model is scaled to ~3.6) a group travels at full explosion. */
window.DX_MODELS = {
  pc: {
    file: 'pc.glb', rot: [0, 0, 0],
    fallback: 'case',
    groups: [
      { id: 'glass', test: (n, m) => m === 'GlassM', dir: (n) => /top/i.test(n) ? [0, 1.6, 0.6] : /side/i.test(n) ? [1.7, 0, 0.6] : [0, 0, 2.6] },
      { id: 'gpu', test: (n, m) => /^(RTX|GPU)/i.test(m), dir: [0, 0, 1.7] },
      { id: 'cool', test: (n, m) => /^(Tubing|Radiator|Fan[123]M|Pump|WCBlock|RESMOUNT|RGBM|Fas)/i.test(m), dir: [1.3, 0, 1.1] },
      { id: 'psu', test: (n, m) => /^PSU/i.test(m), dir: [0, -1.1, 0.8] },
      { id: 'ram', test: (n, m) => /^Ram/i.test(m), dir: [.5, .3, 1.5] },
      { id: 'ssd', test: (n, m) => /^(SSD|M2_|BoardM2)/i.test(m), dir: [.2, 0, 1.0] },
      { id: 'cpu', test: (n, m) => /^(CPU|Cubes1M)/i.test(m), dir: [0, 0, 1.2] },
      { id: 'mobo', test: (n, m) => /^(BaseBoard|BoardPlate|BoardChipset|Chip|Capacitor|Mertal|Audio|USB|Pins|VideoPort|Antenna|WhiteBase|I_O|CylinderPin|Metal2m|Battery)/i.test(m), dir: [0, 0, .45] }
    ],
    info: [
      { id: 'glass', n: 'Tempered glass panels', w: 'Clear panels that show the hardware inside and keep dust out. They are the first thing removed for any service work.', k: 'That the case still has fans pulling air in. Glass blocks passive airflow, so a glass-sided PC needs good fans.' },
      { id: 'gpu', n: 'Graphics card (GPU)', w: 'A dedicated graphics processor with its own memory and fans. It draws the picture on the screen and does heavy 3D and video work.', k: 'Seating in the slot, power cables and the driver. A black screen with fans spinning often means a loose card or the wrong monitor input.' },
      { id: 'cool', n: 'Liquid cooling loop', w: 'A pump pushes coolant through a block on the CPU and out to a radiator, where fans blow the heat away. It cools more quietly than a small air cooler.', k: 'Pump noise and tube condition. A stopped pump shows up as CPU temperature climbing within seconds.' },
      { id: 'psu', n: 'Power supply (PSU)', w: 'Converts mains power into the voltages every component needs, and must have enough wattage for the graphics card.', k: 'Wattage headroom and age. Unstable power shows as random shutdowns under load.' },
      { id: 'ram', n: 'Memory (RAM)', w: 'Fast working memory for open programs. More RAM lets more apps and browser tabs stay open before the PC slows down.', k: 'Reseat the sticks first if the PC beeps or fails to start.' },
      { id: 'ssd', n: 'M.2 SSD storage', w: 'A small flash drive that plugs straight into the board. It boots and loads programs far faster than a hard disk.', k: 'Health (SMART), free space and temperature.' },
      { id: 'cpu', n: 'CPU socket and water block', w: 'The processor sits in the socket under a metal block that carries its heat into the coolant loop. It runs every program.', k: 'Temperature and mounting pressure. High idle temperatures usually mean poor contact.' },
      { id: 'mobo', n: 'Motherboard and ports', w: 'The main circuit board: chipset, USB and audio ports, M.2 slots and the connectors that link every other part.', k: 'BIOS version, and that all RAM, drives and USB ports are detected.' },
      { id: 'case', n: 'Case frame, back plate and feet', w: 'The steel frame that holds everything, hides cables behind the board and sets the airflow path.', k: 'Dust filters and cable routing. Blocked airflow is the most common cause of overheating.' }
    ]
  },
  laptop: {
    file: 'laptop.glb', rot: [0, 0, 0],
    fallback: 'deck',
    groups: [
      { id: 'keyboard', test: (n) => /^Keyboard/.test(n), dir: [0, 1.0, 0] },
      { id: 'trackpad', test: (n) => /^Cube\.002/.test(n), dir: [0, .55, .5] },
      { id: 'lid', test: (n) => /^Cube_Material/.test(n), dir: (n) => /004/.test(n) ? [0, 0, -.9] : /002/.test(n) ? [0, 0, .35] : [0, 0, 1.3] },
      { id: 'deck', test: (n) => /^Cube\.001/.test(n), dir: [0, 0, 0] }
    ],
    info: [
      { id: 'lid', n: 'Display lid (cover, frame and screen)', w: 'The lid is built in layers: an outer cover, a frame and the LCD panel. A webcam and the Wi-Fi antennas sit in the frame.', k: 'A cracked panel or flicker is usually the display cable at the hinge, not the main board.' },
      { id: 'keyboard', n: 'Keyboard', w: 'Each key sits on a small switch over a thin circuit layer, wired to the board by a ribbon cable.', k: 'Spilled drinks. Power off at once, then clean and dry before turning on.' },
      { id: 'trackpad', n: 'Trackpad', w: 'A touch-sensitive surface that reads finger position and clicks, replacing a mouse.', k: 'Driver and gesture settings first; many “dead trackpad” faults are a setting.' },
      { id: 'deck', n: 'Base case and palm rest', w: 'The aluminium body that holds the battery, board, fan and SSD, and gives the laptop its rigidity.', k: 'Vents on a soft surface cause overheating. A hard desk or a stand helps airflow.' }
    ]
  },
  phone: {
    file: 'phone.glb', rot: [0, 0, 0],
    fallback: 'body',
    groups: [
      { id: 'screen', test: (n) => /^Phone_Case_PhoneFace/.test(n), dir: [0, 0, .5] },
      { id: 'camera', test: (n) => /^(Phone_Camera|Camera_1|Camera_2|Camera_Light)/.test(n), dir: [.15, 0, -.5] },
      { id: 'buttons', test: (n) => /(Power_Button|Volume)/.test(n), dir: [.5, 0, 0] },
      { id: 'front', test: (n) => /Camera_Front/.test(n), dir: [0, .2, .8] },
      { id: 'body', test: (n) => /^Phone_Case_PhoneCase/.test(n), dir: [0, 0, 0] }
    ],
    info: [
      { id: 'screen', n: 'Display and touch layer', w: 'The OLED or LCD panel with the touch sensor that reads your finger, covered by hardened glass.', k: 'Ghost touches usually mean a damaged digitiser or a poor screen protector.' },
      { id: 'camera', n: 'Rear camera module', w: 'Two lenses, a small image sensor each and a flash. Phone cameras rely heavily on software processing.', k: 'Clean the lens first; most “blurry camera” faults are a smudge.' },
      { id: 'buttons', n: 'Power and volume buttons', w: 'Mechanical buttons on the frame that switch the phone on and off and control volume.', k: 'A stuck button can cause random restarts or a phone that will not boot.' },
      { id: 'front', n: 'Front camera', w: 'The small selfie camera and sensors behind the top of the screen.', k: 'Permissions and a clean lens for video calls.' },
      { id: 'body', n: 'Frame and back case', w: 'The body holds the battery, mainboard and antennas. Many phones use the metal frame itself as an antenna.', k: 'Cracks let water in. A case and a screen protector are the cheapest repair plan.' }
    ]
  },
  camera: {
    file: 'camera.glb', rot: [0, 0, 0], static: true,
    fallback: 'body',
    groups: [],
    spots: [
      { id: 'lens', n: 'Lens and image sensor', pos: [2.6, 4.9, 0] },
      { id: 'shield', n: 'Sun shield and housing', pos: [7.0, 6.6, 0] },
      { id: 'mount', n: 'Mounting bracket', pos: [-1.5, -.2, 0] }
    ],
    info: [
      { id: 'lens', n: 'Lens and image sensor', w: 'The lens focuses the scene on a small sensor, and infrared LEDs around it light the scene in the dark. Focal length sets how wide the view is.', k: 'Focus and field of view at install time. A dirty or fogged lens looks like a camera fault.' },
      { id: 'shield', n: 'Weatherproof housing and sun shield', w: 'A sealed body keeps out rain and dust, and the shield cuts glare and shades the lens from direct sun.', k: 'Seals and the cable gland. Water in the housing kills more outdoor cameras than anything else.' },
      { id: 'mount', n: 'Mounting bracket', w: 'Fixes the camera to a wall or pole and lets you aim it. The network (PoE) cable runs through it.', k: 'Tight fixings and a drip loop in the cable so water cannot run into the camera.' }
    ]
  }
};
