import * as functions from "firebase-functions";
import * as firestoreBackup from "@google-cloud/firestore";

const client = new firestoreBackup.v1.FirestoreAdminClient();
// Replace this value with the storage bucket where you will be storing your Firestore backups.
const bucket = "YOUR_BUCKET_ID";

const scheduledFirestoreExport = functions.pubsub
  .schedule("0 0 * * 0")
  .timeZone("America/Denver")
  .onRun(async () => {
    try {
      const projectId = process.env.GCP_PROJECT || process.env.GCLOUD_PROJECT;
      const databaseName = client.databasePath(
        projectId as string,
        "(default)"
      );
      const responses = await client.exportDocuments({
        name: databaseName,
        outputUriPrefix: bucket,
        collectionIds: []
      });
      const response = responses[0];
      console.log(`Operation Name: ${response["name"]}`);
    } catch (error) {
      console.error(error);
      throw new Error("Export operation failed.");
    }
  });

export default scheduledFirestoreExport;
