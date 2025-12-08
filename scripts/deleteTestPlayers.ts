import * as dotenv from "dotenv";
import * as path from "path";
import { TOTAL_RECORDS, BATCH_SIZE } from "./insertTestPlayers";
// Load environment variables FIRST, before any other imports
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

import { db } from "@/utils/firebase.admin";
import * as fs from "fs";

const MARKER = `TEST_MARKER_${TOTAL_RECORDS}_RECORDS`;
const TEST_IDS_FILE = path.join(process.cwd(), ".test-player-ids.json");

async function deleteTestPlayers(): Promise<void> {
    try {
        console.log("Starting deletion of test records...");

        const playersRef = db.collection("players");
        let deletedCount = 0;

        // Try to load IDs from saved file first
        let idsToDelete: string[] = [];

        if (fs.existsSync(TEST_IDS_FILE)) {
            try {
                const savedIds = JSON.parse(fs.readFileSync(TEST_IDS_FILE, "utf-8"));
                idsToDelete = savedIds;
                console.log(`Loaded ${idsToDelete.length} test player IDs from file`);
            } catch (error) {
                console.warn("Could not read saved IDs file, will query by marker instead");
            }
        }

        // If no saved IDs or file doesn't exist, query by marker
        if (idsToDelete.length === 0) {
            console.log(`Querying for test records marked with: "${MARKER}"...`);
            const snapshot = await playersRef.where("testMarker", "==", MARKER).get();

            if (snapshot.empty) {
                console.log("No test records found to delete");
                return;
            }

            snapshot.forEach((doc) => {
                idsToDelete.push(doc.id);
            });

            console.log(`Found ${idsToDelete.length} test records to delete`);
        }

        // Delete in batches
        for (let batch = 0; batch < idsToDelete.length / BATCH_SIZE; batch++) {
            const batchWrite = db.batch();
            const startIdx = batch * BATCH_SIZE;
            const endIdx = Math.min(startIdx + BATCH_SIZE, idsToDelete.length);

            console.log(
                `Processing deletion batch ${batch + 1}/${Math.ceil(idsToDelete.length / BATCH_SIZE)}...`
            );

            for (let i = startIdx; i < endIdx; i++) {
                const docRef = playersRef.doc(idsToDelete[i]);
                batchWrite.delete(docRef);
            }

            await batchWrite.commit();
            deletedCount += endIdx - startIdx;
            console.log(`Batch committed. Total deleted: ${deletedCount}/${idsToDelete.length}`);
        }

        // Clean up the IDs file
        if (fs.existsSync(TEST_IDS_FILE)) {
            fs.unlinkSync(TEST_IDS_FILE);
            console.log(`Cleaned up IDs file: ${TEST_IDS_FILE}`);
        }

        console.log(`\nSuccessfully deleted ${deletedCount} test records!`);
    } catch (error) {
        console.error("Error deleting test players:", error);
        process.exit(1);
    }
}

deleteTestPlayers();