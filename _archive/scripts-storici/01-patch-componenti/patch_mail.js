const fs = require("fs");
const path = "C:/Users/Fabio/Desktop/mastro-erp-new/components/MessaggiPanel.tsx";
let s = fs.readFileSync(path, "utf8");

if (s.includes("Day.mailInviata")) { console.error("Gia patchato, skip"); process.exit(0); }

const marker = "                    gmailSendReply(to, gmailSelected.subject, gmailReply, gmailSelected.threadId);";
const i = s.indexOf(marker);
if (i < 0) { console.error("ERRORE marker non trovato"); process.exit(1); }

const insertAt = i + marker.length;

const inject =
"\n" +
"                    (async () => {\n" +
"                      try {\n" +
"                        const { Day } = await import(\"@/lib/day-logger\");\n" +
"                        await Day.mailInviata({ destinatario: to, oggetto: gmailSelected?.subject || undefined });\n" +
"                      } catch (e) { console.warn(\"[MessaggiPanel] logEvento Day fallito\", e); }\n" +
"                    })();";

const sNew = s.substring(0, insertAt) + inject + s.substring(insertAt);
fs.writeFileSync(path, sNew, "utf8");

console.log("OK Mail patchato");
console.log("Day.mailInviata count:", (sNew.match(/Day\.mailInviata/g) || []).length);
console.log("day-logger import count:", (sNew.match(/day-logger/g) || []).length);
