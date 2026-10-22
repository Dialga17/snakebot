export const GIFTS = {
  mawar: {
    nama: "Mawar",
    koin: 1,
    aksi: "apel",
    jumlah: 5,
    alias: ["rose"]
  },
  gg: {
    nama: "GG",
    koin: 1,
    aksi: "bom",
    jumlah: 5,
    alias: ["gg"]
  },
  jarihati: {
    nama: "Jari Hati",
    koin: 5,
    aksi: "apel",
    jumlah: 20,
    alias: ["finger heart"]
  },
  rosa: {
    nama: "Rosa",
    koin: 10,
    aksi: "bom",
    jumlah: 30,
    alias: ["rosa"]
  },
  donat: {
    nama: "Donat",
    koin: 30,
    aksi: "bom",
    jumlah: 100,
    alias: ["donut"]
  },
  buket: {
    nama: "Buket Bunga",
    koin: 30,
    aksi: "apel",
    jumlah: 100,
    alias: ["flower bouquet"]
  },
  tanganhati: {
    nama: "Tangan Bentuk Hati",
    koin: 100,
    aksi: "bom",
    jumlah: 1000,
    alias: ["heart hands"]
  },
  galaksi: {
    nama: "Galaksi",
    koin: 1000,
    aksi: "menang",
    jumlah: 1,
    alias: ["galaxy"]
  }
};

export function findGift(name) {
  if (!name) return null;
  let key = String(name).toLowerCase().replace(/\s+/g, "").replace(/[^a-z0-9]/g, "");
  if (GIFTS[key]) return key;
  for (const id in GIFTS) {
    const g = GIFTS[id];
    for (const a of g.alias) {
      if (a.toLowerCase().replace(/\s+/g, "").replace(/[^a-z0-9]/g, "") === key) {
        return id;
      }
    }
  }
  return null;
}

export function publicGifts() {
  const out = {};
  for (const id in GIFTS) {
    const g = GIFTS[id];
    out[id] = { nama: g.nama, koin: g.koin, aksi: g.aksi, jumlah: g.jumlah };
  }
  return out;
}
