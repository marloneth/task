const fs = require("fs");
const convert = require("xml-js");
const axios = require("axios");
const moment = require("moment");
const filePath = "."; // Ruta al directorio que quieres monitorear
const serverURL = "http://gps.monitorapp.io:1880/api/eye"; // URL del servidor donde enviar la petición HTTP
const startDate = moment("2025-2-14"); // Fecha de inicio del periodo
const endDate = moment("2025-2-17"); // Fecha de fin del periodo

process.env.TZ = "America/Mexico_City";

let count = 0;
// Buscar archivos XML al iniciar el script
fs.readdirSync(filePath).forEach((file) => {
  const path = `${filePath}/${file}`;

  const stats = fs.statSync(path);
  const fileCreationDate = moment(stats.birthtime);
  // const fileCreationDate = path.split('.')[0]

  console.log(fileCreationDate);

  if (
    stats.isFile() &&
    fileCreationDate.isBetween(startDate, endDate, null, "()")
  ) {
    checkAndSendXMLFile(path);
  }
});

console.log(`Procesamiento inicial completado en ${__dirname}.`);
console.log(count);

function checkAndSendXMLFile(path) {
  const pathSplit = path.split(".");
  const ext = pathSplit[pathSplit.length - 1];

  if (ext == "xml") {
    // count++;
    // return console.log('entre')
    fs.readFile(`${__dirname}/${path}`, async (err, data) => {
      const result = JSON.parse(
        convert.xml2json(data, { compact: true, spaces: 4 })
      );

      const cleanData = result.root.ReportLine.Data.reduce((elements, row) => {
        const valuesKeys = Object.entries(row._attributes);

        let object = {
          keys: {
            [valuesKeys[0][0]]: valuesKeys[0][1],
            [valuesKeys[1][0]]: valuesKeys[1][1],
          },
        };

        let valuesValues;
        if (Array.isArray(row.TAttrib)) {
          row.TAttrib.forEach((rw) => {
            valuesValues = Object.entries(rw._attributes);
            object = {
              ...object,
              values: {
                [valuesValues[0][0]]: valuesValues[0][1],
                [valuesValues[1][0]]: valuesValues[1][1],
                [valuesValues[2][0]]: valuesValues[2][1],
              },
            };
            elements.push(object);
          });
        } else {
          valuesValues = Object.entries(row.TAttrib._attributes);
          object = {
            ...object,
            values: {
              [valuesValues[0][0]]: valuesValues[0][1],
              [valuesValues[1][0]]: valuesValues[1][1],
              [valuesValues[2][0]]: valuesValues[2][1],
            },
          };
          elements.push(object);
        }
        return elements;
      }, []);

      const cleanMetadata = result.root.Metadatas.Metadata.reduce(
        (elements, row) => {
          const keys = Object.entries(row._attributes).flat();
          const object = {
            [keys[0]]: keys[1],
            value: row._text,
          };
          elements.push(object);
          return elements;
        },
        []
      );
      result.root.ReportLine.Data = cleanData;
      result.root.Metadatas = cleanMetadata;
      await axios
        .post(serverURL, result, {
          headers: {
            "Content-Type": "Application/json",
          },
        })
        .then(() => {
          console.log(`Folder ${filePath} modificado. Enviado al servidor.`);
        })
        .catch((error) => {
          console.error("Error al enviar la petición:", error);
        });
    });
  }
}
