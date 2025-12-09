import * as dotenv from "dotenv";
import * as path from "path";

// Load environment variables FIRST, before any other imports
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

import { db } from "@/utils/firebase.admin";
import admin from "firebase-admin";
import * as fs from "fs";

export const TOTAL_RECORDS = 100;
export const BATCH_SIZE = 10;
const MARKER = `TEST_MARKER_${TOTAL_RECORDS}_RECORDS`;
const TEST_IDS_FILE = path.join(process.cwd(), ".test-player-ids.json");

interface TestPlayer {
    avatar: string;
    branch: string;
    createdAt: admin.firestore.Timestamp;
    email: string;
    lastGamePlayedAt: admin.firestore.Timestamp;
    society: string;
    surveysCompleted: string[];
    totalDisinformerPoints: number;
    totalGamesPlayed: number;
    totalNetizenPoints: number;
    username: string;
    username_lowercase: string;
    testMarker?: string;
}

function generateRandomPoints(): { disinformer: number; netizen: number } {
    return {
        disinformer: Math.floor(Math.random() * 300) + 200,
        netizen: Math.floor(Math.random() * 300) + 200,
    };
}

function generateTestPlayer(index: number): TestPlayer {
    const points = generateRandomPoints();
    const now = new Date();

    return {
        avatar: `assets/images/avatars/avatar-${(index % 10) + 1}.png`,
        branch: [
            "New South Wales",
            "Victoria",
            "Queensland",
            "South Australia",
            "Western Australia",
            "Tasmania",
            "Northern Territory",
            "Australian Capital Territory",
        ][index % 8],
        createdAt: admin.firestore.Timestamp.fromDate(
            new Date(now.getTime() - Math.random() * 30 * 24 * 60 * 60 * 1000)
        ),
        email: `test_user_${index}@test.com`,
        lastGamePlayedAt: admin.firestore.Timestamp.fromDate(
            new Date(now.getTime() - Math.random() * 7 * 24 * 60 * 60 * 1000)
        ),
        society: ["AU", "NZ", "GB", "US", "CA"][index % 5],
        surveysCompleted: [],
        totalDisinformerPoints: points.disinformer,
        totalGamesPlayed: Math.floor(Math.random() * 100) + 1,
        totalNetizenPoints: points.netizen,
        username: `test_player_${index}`,
        username_lowercase: `test_player_${index}`,
        testMarker: MARKER,
    };
}

async function insertTestPlayers(): Promise<void> {
    try {
        console.log(`Starting insertion of ${TOTAL_RECORDS} test records...`);

        const playersRef = db.collection("players");
        const insertedIds: string[] = [];
        let totalInserted = 0;

        for (let batch = 0; batch < TOTAL_RECORDS / BATCH_SIZE; batch++) {
            const batchWrite = db.batch();
            const startIdx = batch * BATCH_SIZE;
            const endIdx = Math.min(startIdx + BATCH_SIZE, TOTAL_RECORDS);

            console.log(`Processing batch ${batch + 1}/${Math.ceil(TOTAL_RECORDS / BATCH_SIZE)}...`);

            for (let i = startIdx; i < endIdx; i++) {
                const testPlayer = generateTestPlayer(i);
                const docRef = playersRef.doc(`test_player_${i}`);
                batchWrite.set(docRef, testPlayer);
                insertedIds.push(`test_player_${i}`);
            }

            await batchWrite.commit();
            totalInserted += endIdx - startIdx;
            console.log(`Batch committed. Total inserted: ${totalInserted}/${TOTAL_RECORDS}`);
        }

        // Save IDs to file for deletion script
        fs.writeFileSync(TEST_IDS_FILE, JSON.stringify(insertedIds, null, 2));

        console.log(`\nSuccessfully inserted ${totalInserted} test records!`);
        console.log(`Test player IDs saved to: ${TEST_IDS_FILE}`);
        console.log(`Test records marked with testMarker: "${MARKER}"`);
        console.log(`\nTo delete these records, run: npm run delete-test-players`);
    } catch (error) {
        console.error("Error inserting test players:", error);
        process.exit(1);
    }
}

if (process.argv[1]?.endsWith('insertTestPlayers.ts')) {
    insertTestPlayers();
}