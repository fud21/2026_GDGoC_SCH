require("dotenv/config");
const fs = require("fs");
const path = require("path");
const { parse } = require("csv-parse/sync");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const CSV_PATH = path.join(__dirname, "data", "gwanak_safety_data.csv");
const BATCH_SIZE = 500;

const toFloat = (v) => (v === undefined || v === "" ? null : Number(v));
const toStr = (v) => (v === undefined || v === "" ? null : v);
const toBool = (v) =>
  v === undefined || v === "" ? null : v === "True" || v === "true";

async function main() {
  const raw = fs.readFileSync(CSV_PATH, "utf8").replace(/^﻿/, "");
  const records = parse(raw, { columns: true, skip_empty_lines: true });

  const rows = records.map((r) => ({
    dataType: r.data_type,
    sourceId: r.id,
    name: toStr(r.name),
    address: toStr(r.address),
    lat: toFloat(r.lat),
    lng: toFloat(r.lng),
    cctvPurpose: toStr(r.cctv_purpose),
    cctvCount: toFloat(r.cctv_count),
    cctvPixel: toFloat(r.cctv_pixel),
    installYm: toStr(r.install_ym),
    lampId: toStr(r.lamp_id),
    policeType: toStr(r.police_type),
    crimeYear: toFloat(r.crime_year),
    crimeKill: toFloat(r.crime_kill),
    crimeRob: toFloat(r.crime_rob),
    crimeTheft: toFloat(r.crime_theft),
    crimeViolence: toFloat(r.crime_violence),
    lampType: toStr(r.lamp_type),
    dongCode: toStr(r.dong_code),
    dongName: toStr(r.dong_name),
    sggCode: toStr(r.sgg_code),
    isGwanak: toBool(r.is_gwanak),
  }));

  await prisma.safetyData.deleteMany();

  let inserted = 0;
  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE);
    const result = await prisma.safetyData.createMany({ data: batch });
    inserted += result.count;
  }

  console.log(`총 ${records.length}건 중 ${inserted}건 저장 완료`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
