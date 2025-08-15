// convert-csv-to-json.js
const fs = require("fs");
const path = require("path");
const csv = require("csv-parser");

const inputPath = path.join(__dirname, "stores.csv");
const outputPath = path.join(__dirname, "src", "data", "initialStores.json");

const results = [];

fs.createReadStream(inputPath)
  .pipe(csv())
  .on("data", (row) => {
    results.push({
      id: row.id,
      name: row.name,
      zipcode: row.zipcode,
      prefecture: row.prefecture,
      city: row.city,
      streetAddress: row.streetAddress,
      building: row.building || "",
      visited: row.visited === "true",
      visitDate: row.visitDate || "",
      visitCount: Number(row.visitCount || 0),
      favorite: row.favorite === "true",
      closed: row.closed === "true",
      memo: row.memo || ""
    });
  })
  .on("end", () => {
    fs.writeFileSync(outputPath, JSON.stringify(results, null, 2), "utf-8");
    console.log(`✅ initialStores.json を出力しました → ${outputPath}`);
  });
