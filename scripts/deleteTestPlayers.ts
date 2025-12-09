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
    console.log("Starting deletion of test records...");

    const playersRef = db.collection("players");
    let deletedCount = 0;
    let failedCount = 0;

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
        try {
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
        } catch (error) {
            console.error("Error querying for test records:", error);
            process.exit(1);
        }
    }

    // Delete in batches
    const totalBatches = Math.ceil(idsToDelete.length / BATCH_SIZE);
    for (let batch = 0; batch < totalBatches; batch++) {
        const batchWrite = db.batch();
        const startIdx = batch * BATCH_SIZE;
        const endIdx = Math.min(startIdx + BATCH_SIZE, idsToDelete.length);

        console.log(
            `Processing deletion batch ${batch + 1}/${totalBatches}...`
        );

        for (let i = startIdx; i < endIdx; i++) {
            const docRef = playersRef.doc(idsToDelete[i]);
            batchWrite.delete(docRef);
        }

        try {
            await batchWrite.commit();
            deletedCount += endIdx - startIdx;
            console.log(`Batch committed. Total deleted: ${deletedCount}/${idsToDelete.length}`);
        } catch (error) {
            failedCount += endIdx - startIdx;
            console.error(`Batch ${batch + 1} failed:`, error);
        }
    }

    // Clean up the IDs file
    if (fs.existsSync(TEST_IDS_FILE)) {
        fs.unlinkSync(TEST_IDS_FILE);
        console.log(`Cleaned up IDs file: ${TEST_IDS_FILE}`);
    }

    console.log(`\nDeletion complete. Successfully deleted: ${deletedCount}, Failed: ${failedCount}`);
    if (failedCount > 0) {
        console.log("Some records may not have been deleted due to errors.");
        process.exit(1);
    }
}

if (process.argv[1]?.endsWith('deleteTestPlayers.ts')) {
    deleteTestPlayers();
}