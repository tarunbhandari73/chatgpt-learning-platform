import { config as loadEnv } from "dotenv";
loadEnv({ path: ".env.local" });

import { getAdmin } from "../src/lib/firebase/admin";

async function main() {
  const { auth, db } = getAdmin();

  const userList = await auth.listUsers(1);
  console.log(
    `[ok] Admin SDK reachable. Project has ${userList.users.length} user(s) in the first page.`,
  );

  const probe = await db.collection("_probe").doc("ping").get();
  console.log(
    `[ok] Firestore reachable. _probe/ping exists=${probe.exists}.`,
  );
}

main().catch((err) => {
  console.error("[fail]", err);
  process.exit(1);
});
