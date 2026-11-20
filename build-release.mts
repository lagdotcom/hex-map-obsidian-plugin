import { ZipArchive } from "archiver";
import { createReadStream, createWriteStream, readFileSync } from "node:fs";

const folderName = "hex-map";
const fileNames = ["main.js", "manifest.json", "styles.css", "versions.json"];

async function main() {
  const json = JSON.parse(readFileSync("package.json", "utf-8"));
  const output = createWriteStream(`hex-map-${json["version"]}.zip`);
  const archive = new ZipArchive({ zlib: { level: 9 } });

  output.on("close", function () {
    console.log(archive.pointer() + " total bytes");
    console.log(
      "archiver has been finalized and the output file descriptor has closed.",
    );
  });
  output.on("end", function () {
    console.log("Data has been drained");
  });
  archive.on("warning", function (err) {
    if (err.code === "ENOENT") {
      // log warning
      console.log(err);
    } else {
      // throw error
      throw err;
    }
  });
  archive.on("error", function (err) {
    throw err;
  });
  archive.pipe(output);

  for (const fn of fileNames)
    archive.append(createReadStream(fn), { name: `${folderName}/${fn}` });

  archive.finalize();
}

main();
