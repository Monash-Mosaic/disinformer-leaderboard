const PRODUCTION_FIRESTORE_DATABASE_ID = "disinformer-prod-eu";
const DEFAULT_FIRESTORE_DATABASE_ID = "(default)";

export function getFirestoreDatabaseId(): string {
    const explicitDatabaseId = process.env.NEXT_PUBLIC_FIRESTORE_DATABASE_ID;
    if (explicitDatabaseId) {
        return explicitDatabaseId;
    }

    return process.env.NEXT_PUBLIC_APP_ENV === "production"
        ? PRODUCTION_FIRESTORE_DATABASE_ID
        : DEFAULT_FIRESTORE_DATABASE_ID;
}
