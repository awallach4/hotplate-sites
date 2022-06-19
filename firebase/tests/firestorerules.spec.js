const firebase = require("@firebase/rules-unit-testing");
const fs = require("fs");
const http = require("http");

const PROJECT_ID = "hotplate-demo";
const COVERAGE_URL = `http://${process.env.FIRESTORE_EMULATOR_HOST}/emulator/v1/projects/${PROJECT_ID}:ruleCoverage.html`;

function getAuthedFirestore(auth) {
  return firebase
    .initializeTestApp({
      projectId: PROJECT_ID,
      auth
    })
    .firestore();
}

function getAdminApp() {
  return firebase
    .initializeAdminApp({
      projectId: PROJECT_ID
    })
    .firestore();
}

beforeEach(async () => {
  await firebase.clearFirestoreData({ projectId: PROJECT_ID });
  const db = getAdminApp();
  await db.doc("pages/page1").set({
    dbPath: "/page1",
    id: "page1",
    index: 0,
    name: "Test Page 1",
    permissions: "webmasters"
  });
  await db.doc("pages/page2").set({
    dbPath: "/page2",
    id: "page2",
    index: 1,
    name: "Test Page 2",
    permissions: "users"
  });
  await db.doc("pages/page3").set({
    dbPath: "/page3",
    id: "page3",
    index: 2,
    name: "Test Page 3",
    permissions: "public"
  });
});

before(async () => {
  const rules = fs.readFileSync("../firestore.rules", "utf8");
  await firebase.loadFirestoreRules({ projectId: PROJECT_ID, rules });
});

after(async () => {
  await Promise.all(firebase.apps().map((app) => app.delete()));
  const coverageFile = "firestore-coverage.html";
  const fstream = fs.createWriteStream(coverageFile);
  await new Promise((resolve, reject) => {
    http.get(COVERAGE_URL, (res) => {
      res.pipe(fstream, { end: true });
      res.on("end", resolve);
      res.on("error", reject);
    });
  });

  console.log(`View firestore rule coverage information at ${coverageFile}\n`);
});

describe("Firestore Security Rules", () => {
  it("allow any user to get the special page sitemap", async () => {
    const db = getAuthedFirestore(null);
    const pages = db.collection("pages");
    await firebase.assertSucceeds(pages.get());
  });

  it("allow admins to edit the special page sitemap", async () => {
    const db = getAuthedFirestore({
      uid: "admin",
      admin: true,
      webmaster: true,
      authorized: true,
      email_verified: true
    });
    const pages = db.doc("pages/page");
    await firebase.assertSucceeds(
      pages.set(
        {
          dbPath: "/page",
          id: "abc123",
          index: 0,
          name: "Page",
          permissions: "public"
        },
        { merge: true }
      )
    );
  });

  it("allow webmasters to edit the special page sitemap", async () => {
    const db = getAuthedFirestore({
      uid: "webmaster",
      admin: false,
      webmaster: true,
      authorized: true,
      email_verified: true
    });
    const pages = db.doc("pages/page");
    await firebase.assertSucceeds(
      pages.set(
        {
          dbPath: "/page",
          id: "abc123",
          index: 0,
          name: "Page",
          permissions: "public"
        },
        { merge: true }
      )
    );
  });

  it("prevent incorrect special page metadata structures", async () => {
    const db = getAuthedFirestore({
      uid: "admin",
      admin: true,
      webmaster: true,
      authorized: true,
      email_verified: true
    });
    const pages = db.doc("pages/page");
    await firebase.assertFails(pages.set({ badData: "hello" }));
  });

  it("prevent users from editing the special page sitemap", async () => {
    const db = getAuthedFirestore({
      uid: "user",
      admin: false,
      webmaster: false,
      authorized: true,
      email_verified: true
    });
    const pages = db.doc("pages/page");
    await firebase.assertFails(
      pages.set(
        {
          dbPath: "/page",
          id: "abc123",
          index: 0,
          name: "Page",
          permissions: "public"
        },
        { merge: true }
      )
    );
  });

  it("prevent unauthenticated users from editing the special page sitemap", async () => {
    const db = getAuthedFirestore(null);
    const pages = db.doc("pages/page");
    await firebase.assertFails(
      pages.set(
        {
          dbPath: "/page",
          id: "abc123",
          index: 0,
          name: "Page",
          permissions: "public"
        },
        { merge: true }
      )
    );
  });

  it("allow admins to view special page data", async () => {
    const db = getAuthedFirestore({
      uid: "admin",
      admin: true,
      webmaster: true,
      authorized: true,
      email_verified: true
    });
    const docs = db.collection("pages/page1/components");
    await firebase.assertSucceeds(docs.get());
  });

  it("allow webmasters to view special page data", async () => {
    const db = getAuthedFirestore({
      uid: "webmaster",
      admin: false,
      webmaster: true,
      authorized: true,
      email_verified: true
    });
    const docs = db.collection("pages/page1/components");
    await firebase.assertSucceeds(docs.get());
  });

  it("prevent users from viewing special page data that has webmaster permissions", async () => {
    const admin = getAdminApp();
    await admin.doc("pages/page1/components/comp").set({
      data: {
        hidden: false
      }
    });
    const db = getAuthedFirestore({
      uid: "user",
      admin: false,
      webmaster: false,
      authorized: true,
      email_verified: true
    });
    const doc = db.doc("pages/page1/components/comp");
    await firebase.assertFails(doc.get());
  });

  it("prevent unauthenticated users from viewing special page data that has webmaster permissions", async () => {
    const admin = getAdminApp();
    await admin.doc("pages/page1/components/comp").set({
      data: {
        hidden: false
      }
    });
    const db = getAuthedFirestore(null);
    const doc = db.doc("pages/page1/components/comp");
    await firebase.assertFails(doc.get());
  });

  it("allow users to view special page data that has user permissions", async () => {
    const admin = getAdminApp();
    await admin.doc("pages/page2/components/comp").set({
      data: {
        hidden: false
      }
    });
    const db = getAuthedFirestore({
      uid: "user",
      admin: false,
      webmaster: false,
      authorized: true,
      email_verified: true
    });
    const doc = db.doc("pages/page2/components/comp");
    await firebase.assertSucceeds(doc.get());
  });

  it("prevent unauthenticated users from viewing special page data that has user permissions", async () => {
    const admin = getAdminApp();
    await admin.doc("pages/page2/components/comp").set({
      data: {
        hidden: false
      }
    });
    const db = getAuthedFirestore(null);
    const doc = db.doc("pages/page2/components/comp");
    await firebase.assertFails(doc.get());
  });

  it("allow users to view special page data that has public permissions", async () => {
    const admin = getAdminApp();
    await admin.doc("pages/page3/components/comp").set({
      data: {
        hidden: false
      }
    });
    const db = getAuthedFirestore({
      uid: "user",
      admin: false,
      webmaster: false,
      authorized: true,
      email_verified: true
    });
    const doc = db.doc("pages/page3/components/comp");
    await firebase.assertSucceeds(doc.get());
  });

  it("allow unauthenticated users to view special page data that has public permissions", async () => {
    const admin = getAdminApp();
    await admin.doc("pages/page3/components/comp").set({
      data: {
        hidden: false
      }
    });
    const db = getAuthedFirestore(null);
    const doc = db.doc("pages/page3/components/comp");
    await firebase.assertSucceeds(doc.get());
  });

  it("prevent users from viewing special page data that has user permissions and is hidden", async () => {
    const admin = getAdminApp();
    await admin.doc("pages/page2/components/comp").set({
      data: {
        hidden: true
      }
    });
    const db = getAuthedFirestore({
      uid: "user",
      admin: false,
      webmaster: false,
      authorized: true,
      email_verified: true
    });
    const doc = db.doc("pages/page2/components/comp");
    await firebase.assertFails(doc.get());
  });

  it("prevent users from viewing special page data that has public permissions and is hidden", async () => {
    const admin = getAdminApp();
    await admin.doc("pages/page3/components/comp").set({
      data: {
        hidden: true
      }
    });
    const db = getAuthedFirestore({
      uid: "user",
      admin: false,
      webmaster: false,
      authorized: true,
      email_verified: true
    });
    const doc = db.doc("pages/page3/components/comp");
    await firebase.assertFails(doc.get());
  });

  it("prevents unauthenticated users from viewing special page data that has public permissions and is hidden", async () => {
    const admin = getAdminApp();
    await admin.doc("pages/page3/components/comp").set({
      data: {
        hidden: true
      }
    });
    const db = getAuthedFirestore(null);
    const doc = db.doc("pages/page3/components/comp");
    await firebase.assertFails(doc.get());
  });

  it("allow admins to edit special page data", async () => {
    const db = getAuthedFirestore({
      uid: "admin",
      admin: true,
      webmaster: true,
      authorized: true,
      email_verified: true
    });
    const doc = db.doc("pages/page1/components/comp");
    await firebase.assertSucceeds(
      doc.set(
        {
          data: {},
          props: {},
          vueComp: "",
          index: 0
        },
        { merge: true }
      )
    );
  });

  it("allow webmasters to edit special page data", async () => {
    const db = getAuthedFirestore({
      uid: "webmaster",
      admin: false,
      webmaster: true,
      authorized: true,
      email_verified: true
    });
    const doc = db.doc("pages/page1/components/comp");
    await firebase.assertSucceeds(
      doc.set(
        {
          data: {},
          props: {},
          vueComp: "",
          index: 0
        },
        { merge: true }
      )
    );
  });

  it("prevent incorrect special page data structures", async () => {
    const db = getAuthedFirestore({
      uid: "admin",
      admin: true,
      webmaster: true,
      authorized: true,
      email_verified: true
    });
    const page = db.doc("pages/page1/components/comp");
    await firebase.assertFails(page.set({ badData: "hello" }));
  });

  it("prevent users from editing special page data", async () => {
    const db = getAuthedFirestore({
      uid: "user",
      admin: false,
      webmaster: false,
      authorized: true,
      email_verified: true
    });
    const doc = db.doc("pages/page1/components/comp");
    await firebase.assertFails(
      doc.set(
        {
          data: {},
          props: {},
          vueComp: "",
          index: 0
        },
        { merge: true }
      )
    );
  });

  it("prevent unauthenticated users from editing special page data", async () => {
    const db = getAuthedFirestore(null);
    const doc = db.doc("pages/page1/components/comp");
    await firebase.assertFails(
      doc.set(
        {
          data: {},
          props: {},
          vueComp: "",
          index: 0
        },
        { merge: true }
      )
    );
  });

  it("allow admins to view special page inner component data", async () => {
    const db = getAuthedFirestore({
      uid: "admin",
      admin: true,
      webmaster: true,
      authorized: true,
      email_verified: true
    });
    const doc = db.doc("pages/page1/components/comp/data/item");
    await firebase.assertSucceeds(doc.get());
  });

  it("allow webmasters to view special page inner component data", async () => {
    const db = getAuthedFirestore({
      uid: "webmaster",
      admin: false,
      webmaster: true,
      authorized: true,
      email_verified: true
    });
    const doc = db.doc("pages/page1/components/comp/data/item");
    await firebase.assertSucceeds(doc.get());
  });

  it("prevent users from viewing special page inner component data that has webmaster permissions", async () => {
    const admin = getAdminApp();
    await admin.doc("pages/page1/components/comp").set({
      data: {
        hidden: false
      }
    });
    await admin.doc("pages/page1/components/comp/data/item").set({
      hello: "hi"
    });
    const db = getAuthedFirestore({
      uid: "user",
      admin: false,
      webmaster: false,
      authorized: true,
      email_verified: true
    });
    const doc = db.doc("pages/page1/components/comp/data/item");
    await firebase.assertFails(doc.get());
  });

  it("prevent unauthenticated users from viewing special page inner component data that has webmaster permissions", async () => {
    const admin = getAdminApp();
    await admin.doc("pages/page1/components/comp").set({
      data: {
        hidden: false
      }
    });
    await admin.doc("pages/page1/components/comp/data/item").set({
      hello: "hi"
    });
    const db = getAuthedFirestore(null);
    const doc = db.doc("pages/page1/components/comp/data/item");
    await firebase.assertFails(doc.get());
  });

  it("allow users to view special page inner component data that has user permissions", async () => {
    const admin = getAdminApp();
    await admin.doc("pages/page2/components/comp").set({
      data: {
        hidden: false
      }
    });
    await admin.doc("pages/page2/components/comp/data/item").set({
      hello: "hi"
    });
    const db = getAuthedFirestore({
      uid: "user",
      admin: false,
      webmaster: false,
      authorized: true,
      email_verified: true
    });
    const doc = db.doc("pages/page2/components/comp/data/item");
    await firebase.assertSucceeds(doc.get());
  });

  it("allow users to view special page subcomponent data that has user permissions and is not hidden", async () => {
    const admin = getAdminApp();
    await admin.doc("pages/page2/components/comp").set({
      data: {
        hidden: false
      }
    });
    await admin.doc("pages/page2/components/comp/data/item").set({
      data: {
        hidden: false
      }
    });
    const db = getAuthedFirestore({
      uid: "user",
      admin: false,
      webmaster: false,
      authorized: true,
      email_verified: true
    });
    const doc = db.doc("pages/page2/components/comp/data/item");
    await firebase.assertSucceeds(doc.get());
  });

  it("prevent users from viewing special page subcomponent data that has user permissions and is hidden", async () => {
    const admin = getAdminApp();
    await admin.doc("pages/page2/components/comp").set({
      data: {
        hidden: false
      }
    });
    await admin.doc("pages/page2/components/comp/data/item").set({
      data: {
        hidden: true
      }
    });
    const db = getAuthedFirestore({
      uid: "user",
      admin: false,
      webmaster: false,
      authorized: true,
      email_verified: true
    });
    const doc = db.doc("pages/page2/components/comp/data/item");
    await firebase.assertFails(doc.get());
  });

  it("prevent unauthenticated users from viewing special page inner component data that has user permissions", async () => {
    const admin = getAdminApp();
    await admin.doc("pages/page2/components/comp").set({
      data: {
        hidden: false
      }
    });
    await admin.doc("pages/page2/components/comp/data/item").set({
      hello: "hi"
    });
    const db = getAuthedFirestore(null);
    const doc = db.doc("pages/page2/components/comp/data/item");
    await firebase.assertFails(doc.get());
  });

  it("allow unauthenticated users to view special page inner component data that has public permissions", async () => {
    const admin = getAdminApp();
    await admin.doc("pages/page3/components/comp").set({
      data: {
        hidden: false
      }
    });
    await admin.doc("pages/page3/components/comp/data/item").set({
      hello: "hi"
    });
    const db = getAuthedFirestore(null);
    const doc = db.doc("pages/page3/components/comp/data/item");
    await firebase.assertSucceeds(doc.get());
  });

  it("allow unauthenticated users to view special page subcomponent data that has public permissions and is not hidden", async () => {
    const admin = getAdminApp();
    await admin.doc("pages/page3/components/comp").set({
      data: {
        hidden: false
      }
    });
    await admin.doc("pages/page3/components/comp/data/item").set({
      data: {
        hidden: false
      }
    });
    const db = getAuthedFirestore({
      uid: "user",
      admin: false,
      webmaster: false,
      authorized: true,
      email_verified: true
    });
    const doc = db.doc("pages/page3/components/comp/data/item");
    await firebase.assertSucceeds(doc.get());
  });

  it("prevent unauthenticated users from viewing special page subcomponent data that has public permissions and is hidden", async () => {
    const admin = getAdminApp();
    await admin.doc("pages/page3/components/comp").set({
      data: {
        hidden: false
      }
    });
    await admin.doc("pages/page3/components/comp/data/item").set({
      data: {
        hidden: true
      }
    });
    const db = getAuthedFirestore({
      uid: "user",
      admin: false,
      webmaster: false,
      authorized: true,
      email_verified: true
    });
    const doc = db.doc("pages/page3/components/comp/data/item");
    await firebase.assertFails(doc.get());
  });

  it("allow users to view special page inner component data that has public permissions", async () => {
    const admin = getAdminApp();
    await admin.doc("pages/page3/components/comp").set({
      data: {
        hidden: false
      }
    });
    await admin.doc("pages/page3/components/comp/data/item").set({
      hello: "hi"
    });
    const db = getAuthedFirestore({
      uid: "user",
      admin: false,
      webmaster: false,
      authorized: true,
      email_verified: true
    });
    const doc = db.doc("pages/page3/components/comp/data/item");
    await firebase.assertSucceeds(doc.get());
  });

  it("allow users to view special page subcomponent data that has public permissions and is not hidden", async () => {
    const admin = getAdminApp();
    await admin.doc("pages/page3/components/comp").set({
      data: {
        hidden: false
      }
    });
    await admin.doc("pages/page3/components/comp/data/item").set({
      data: {
        hidden: false
      }
    });
    const db = getAuthedFirestore({
      uid: "user",
      admin: false,
      webmaster: false,
      authorized: true,
      email_verified: true
    });
    const doc = db.doc("pages/page3/components/comp/data/item");
    await firebase.assertSucceeds(doc.get());
  });

  it("prevent users from viewing special page subcomponent data that has public permissions and is hidden", async () => {
    const admin = getAdminApp();
    await admin.doc("pages/page3/components/comp").set({
      data: {
        hidden: false
      }
    });
    await admin.doc("pages/page3/components/comp/data/item").set({
      data: {
        hidden: true
      }
    });
    const db = getAuthedFirestore({
      uid: "user",
      admin: false,
      webmaster: false,
      authorized: true,
      email_verified: true
    });
    const doc = db.doc("pages/page3/components/comp/data/item");
    await firebase.assertFails(doc.get());
  });

  it("prevent users from viewing special page inner component data on hidden components", async () => {
    const admin = getAdminApp();
    await admin.doc("pages/page3/components/comp").set({
      data: {
        hidden: true
      }
    });
    const db = getAuthedFirestore({
      uid: "user",
      admin: false,
      webmaster: false,
      authorized: true,
      email_verified: true
    });
    const doc = db.doc("pages/page3/components/comp/data/item");
    await firebase.assertFails(doc.get());
  });

  it("prevent unauthenticated users from viewing special page inner component data on hidden components", async () => {
    const admin = getAdminApp();
    await admin.doc("pages/page3/components/comp").set({
      data: {
        hidden: true
      }
    });
    const db = getAuthedFirestore(null);
    const doc = db.doc("pages/page3/components/comp/data/item");
    await firebase.assertFails(doc.get());
  });

  it("allow admins to edit special page inner component data", async () => {
    const db = getAuthedFirestore({
      uid: "admin",
      admin: true,
      webmaster: true,
      authorized: true,
      email_verified: true
    });
    const doc = db.doc("pages/page1/components/comp/data/item");
    await firebase.assertSucceeds(
      doc.set(
        {
          components: []
        },
        { merge: true }
      )
    );
  });

  it("allow webmasters to edit special page inner component data", async () => {
    const db = getAuthedFirestore({
      uid: "webmaster",
      admin: false,
      webmaster: true,
      authorized: true,
      email_verified: true
    });
    const doc = db.doc("pages/page1/components/comp/data/item");
    await firebase.assertSucceeds(
      doc.set(
        {
          components: []
        },
        { merge: true }
      )
    );
  });

  it("allow users to create special page inner component data that has user permissions and their uid", async () => {
    const db = getAuthedFirestore({
      uid: "user1",
      admin: false,
      webmaster: false,
      authorized: true,
      email_verified: true
    });
    const doc = db.doc("pages/page2/components/comp/data/item");
    await firebase.assertSucceeds(doc.set({ uid: "user1" }, { merge: true }));
  });

  it("prevent users from editing another user's special page inner component data except comments that has user permissions", async () => {
    const admin = getAdminApp();
    await admin
      .doc("pages/page2/components/comp/data/item")
      .set({ uid: "user1" });
    const db = getAuthedFirestore({
      uid: "user2",
      admin: false,
      webmaster: false,
      authorized: true,
      email_verified: true
    });
    const doc = db.doc("pages/page2/components/comp/data/item");
    await firebase.assertFails(
      doc.set({ uid: "user1", newData: "" }, { merge: true })
    );
  });

  it("allow users to edit another user's special page inner component data comments that has user permissions", async () => {
    const admin = getAdminApp();
    await admin
      .doc("pages/page2/components/comp/data/item")
      .set({ uid: "user1", comments: [] });
    const db = getAuthedFirestore({
      uid: "user2",
      admin: false,
      webmaster: false,
      authorized: true,
      email_verified: true
    });
    const doc = db.doc("pages/page2/components/comp/data/item");
    await firebase.assertSucceeds(
      doc.set({ comments: ["hi"] }, { merge: true })
    );
  });

  it("prevent users from deleting another user's special page inner component data that has user permissions", async () => {
    const admin = getAdminApp();
    await admin
      .doc("pages/page2/components/comp/data/item")
      .set({ uid: "user1" });
    const db = getAuthedFirestore({
      uid: "user2",
      admin: false,
      webmaster: false,
      authorized: true,
      email_verified: true
    });
    const doc = db.doc("pages/page2/components/comp/data/item");
    await firebase.assertFails(doc.delete());
  });

  it("prevent users from creating special page inner component data without their uid that has user permissions", async () => {
    const db = getAuthedFirestore({
      uid: "user",
      admin: false,
      webmaster: false,
      authorized: true,
      email_verified: true
    });
    const doc = db.doc("pages/page2/components/comp/data/item");
    await firebase.assertFails(doc.set({}, { merge: true }));
  });

  it("allow users to create special page inner component data that has public permissions and their uid", async () => {
    const db = getAuthedFirestore({
      uid: "user1",
      admin: false,
      webmaster: false,
      authorized: true,
      email_verified: true
    });
    const doc = db.doc("pages/page3/components/comp/data/item");
    await firebase.assertSucceeds(doc.set({ uid: "user1" }, { merge: true }));
  });

  it("prevent users from editing another user's special page inner component data except comments that has public permissions", async () => {
    const admin = getAdminApp();
    await admin
      .doc("pages/page3/components/comp/data/item")
      .set({ uid: "user1" });
    const db = getAuthedFirestore({
      uid: "user2",
      admin: false,
      webmaster: false,
      authorized: true,
      email_verified: true
    });
    const doc = db.doc("pages/page3/components/comp/data/item");
    await firebase.assertFails(doc.set({ uid: "me" }, { merge: true }));
  });

  it("allow users to edit another user's special page inner component data comments that has public permissions", async () => {
    const admin = getAdminApp();
    await admin
      .doc("pages/page3/components/comp/data/item")
      .set({ uid: "user1", comments: [] });
    const db = getAuthedFirestore({
      uid: "user2",
      admin: false,
      webmaster: false,
      authorized: true,
      email_verified: true
    });
    const doc = db.doc("pages/page3/components/comp/data/item");
    await firebase.assertSucceeds(
      doc.set({ comments: ["hi"] }, { merge: true })
    );
  });

  it("prevent users from deleting another user's special page inner component data that has public permissions", async () => {
    const admin = getAdminApp();
    await admin
      .doc("pages/page3/components/comp/data/item")
      .set({ uid: "user1" });
    const db = getAuthedFirestore({
      uid: "user2",
      admin: false,
      webmaster: false,
      authorized: true,
      email_verified: true
    });
    const doc = db.doc("pages/page3/components/comp/data/item");
    await firebase.assertFails(doc.delete());
  });

  it("prevent users from creating special page inner component data without their uid that has public permissions", async () => {
    const db = getAuthedFirestore({
      uid: "user",
      admin: false,
      webmaster: false,
      authorized: true,
      email_verified: true
    });
    const doc = db.doc("pages/page3/components/comp/data/item");
    await firebase.assertFails(doc.set({}, { merge: true }));
  });

  it("prevent users from viewing someone else's profile information", async () => {
    const admin = getAdminApp();
    await admin.doc("users/person1").set({
      disabled: false,
      displayName: "new",
      email: "test@test.com",
      permissions: "User",
      photoURL: ""
    });
    const db = getAuthedFirestore({
      uid: "person",
      authorized: true,
      email_verified: true
    });
    const users = db.doc("users/person1");
    await firebase.assertFails(users.get());
  });

  it("allow users to view their own profile information.", async () => {
    const db = getAuthedFirestore({ uid: "person" });
    const users = db.doc("users/person");
    await firebase.assertSucceeds(users.get());
  });

  it("prevent unauthenticated users from viewing profile information", async () => {
    const db = getAuthedFirestore(null);
    const users = db.collection("users");
    await firebase.assertFails(users.get());
  });

  it("allow users to edit their own profile if their email is verified", async () => {
    const admin = getAdminApp();
    await admin.doc("users/person").set({
      address: "",
      bio: "",
      contact: "",
      disabled: false,
      displayName: "new",
      email: "test@test.com",
      permissions: "User",
      phone: "",
      photoURL: "",
      rank: "",
      type: "Scout"
    });
    const db = getAuthedFirestore({
      uid: "person",
      authorized: true,
      email_verified: true
    });
    const user = db.doc("users/person");
    await firebase.assertSucceeds(
      user.set({ displayName: "person" }, { merge: true })
    );
  });

  it("prevent users from editing restricted fields in their profile", async () => {
    const admin = getAdminApp();
    await admin.doc("users/person").set({
      address: "",
      bio: "",
      contact: "",
      disabled: false,
      displayName: "new",
      email: "test@test.com",
      permissions: "User",
      phone: "",
      photoURL: "",
      rank: "",
      type: "Scout"
    });
    const db = getAuthedFirestore({
      uid: "person",
      authorized: true,
      email_verified: true
    });
    const user = db.doc("users/person");
    await firebase.assertFails(
      user.set({ permissions: "admin" }, { merge: true })
    );
  });

  it("prevent users from editing their own profile if their email is not verified", async () => {
    const admin = getAdminApp();
    await admin.doc("users/person").set({
      address: "",
      bio: "",
      contact: "",
      disabled: false,
      displayName: "new",
      email: "test@test.com",
      permissions: "User",
      phone: "",
      photoURL: "",
      rank: "",
      type: "Scout"
    });
    const db = getAuthedFirestore({
      uid: "person",
      authorized: true,
      email_verified: false
    });
    const user = db.doc("users/person");
    await firebase.assertFails(
      user.set({ displayName: "person" }, { merge: true })
    );
  });

  it("prevent users from editing their own profile if they are not authorized", async () => {
    const admin = getAdminApp();
    await admin.doc("users/person").set({
      address: "",
      bio: "",
      contact: "",
      disabled: false,
      displayName: "new",
      email: "test@test.com",
      permissions: "User",
      phone: "",
      photoURL: "",
      rank: "",
      type: "Scout"
    });
    const db = getAuthedFirestore({
      uid: "person",
      authorized: false,
      email_verified: true
    });
    const user = db.doc("users/person");
    await firebase.assertFails(
      user.set({ displayName: "person" }, { merge: true })
    );
  });

  it("prevent users from editing other user profiles", async () => {
    const admin = getAdminApp();
    await admin.doc("users/person").set({
      address: "",
      bio: "",
      contact: "",
      disabled: false,
      displayName: "new",
      email: "test@test.com",
      permissions: "User",
      phone: "",
      photoURL: "",
      rank: "",
      type: "Scout"
    });
    const db = getAuthedFirestore({
      uid: "maliciousUser",
      authorized: true,
      email_verified: true
    });
    const user = db.doc("users/person");
    await firebase.assertFails(
      user.set({ displayName: "person" }, { merge: true })
    );
  });

  it("allow admins to view user profiles", async () => {
    const db = getAuthedFirestore({
      uid: "admin",
      admin: true,
      webmaster: true,
      authorized: true,
      email_verified: true
    });
    const user = db.doc("users/some-user");
    await firebase.assertSucceeds(user.get());
  });

  it("allow admins to edit user profiles", async () => {
    const admin = getAdminApp();
    await admin.doc("users/some-user").set({
      address: "",
      bio: "",
      contact: "",
      disabled: false,
      displayName: "new",
      email: "test@test.com",
      permissions: "User",
      phone: "",
      photoURL: "",
      rank: "",
      type: "Scout"
    });
    const db = getAuthedFirestore({
      uid: "admin",
      admin: true,
      webmaster: true,
      authorized: true,
      email_verified: true
    });
    const user = db.doc("users/some-user");
    await firebase.assertSucceeds(
      user.set({ displayName: "Updated" }, { merge: true })
    );
  });

  it("prevent webmasters from editing user profiles", async () => {
    const admin = getAdminApp();
    await admin.doc("users/some-user").set({
      address: "",
      bio: "",
      contact: "",
      disabled: false,
      displayName: "new",
      email: "test@test.com",
      permissions: "User",
      phone: "",
      photoURL: "",
      rank: "",
      type: "Scout"
    });
    const db = getAuthedFirestore({
      uid: "webmaster",
      admin: false,
      webmaster: true,
      authorized: true,
      email_verified: true
    });
    const user = db.doc("users/some-user");
    await firebase.assertFails(
      user.set({ displayName: "Updated" }, { merge: true })
    );
  });

  it("allow admins to edit the admin collection", async () => {
    const db = getAuthedFirestore({
      uid: "admin",
      admin: true,
      webmaster: true,
      authorized: true,
      email_verified: true
    });
    const person = db.doc("admin/person");
    await firebase.assertSucceeds(
      person.set({ name: "Person" }, { merge: true })
    );
  });

  it("allow admins to read the admin collection", async () => {
    const db = getAuthedFirestore({
      uid: "admin",
      admin: true,
      webmaster: true,
      authorized: true,
      email_verified: true
    });
    const person = db.doc("admin/person");
    await firebase.assertSucceeds(person.get());
  });

  it("allow admins to edit the webmasters collection", async () => {
    const db = getAuthedFirestore({
      uid: "admin",
      admin: true,
      webmaster: true,
      authorized: true,
      email_verified: true
    });
    const person = db.doc("webmasters/person");
    await firebase.assertSucceeds(
      person.set({ name: "Person" }, { merge: true })
    );
  });

  it("allow admins to read the webmasters collection", async () => {
    const db = getAuthedFirestore({
      uid: "admin",
      admin: true,
      webmaster: true,
      authorized: true,
      email_verified: true
    });
    const person = db.doc("webmasters/person");
    await firebase.assertSucceeds(person.get());
  });

  it("prevent other users from editing the admin collection", async () => {
    const db = getAuthedFirestore({
      uid: "admin",
      admin: false,
      webmaster: true,
      authorized: true,
      email_verified: true
    });
    const person = db.doc("admin/person");
    await firebase.assertFails(person.set({ name: "Person" }, { merge: true }));
  });

  it("prevent other users from reading the admin collection", async () => {
    const db = getAuthedFirestore({
      uid: "admin",
      admin: false,
      webmaster: true,
      authorized: true,
      email_verified: true
    });
    const person = db.doc("admin/person");
    await firebase.assertFails(person.get());
  });

  it("prevent other users from editing the webmasters collection", async () => {
    const db = getAuthedFirestore({
      uid: "admin",
      admin: false,
      webmaster: true,
      authorized: true,
      email_verified: true
    });
    const person = db.doc("webmasters/person");
    await firebase.assertFails(person.set({ name: "Person" }, { merge: true }));
  });

  it("prevent other users from reading the webmasters collection", async () => {
    const db = getAuthedFirestore({
      uid: "admin",
      admin: false,
      webmaster: true,
      authorized: true,
      email_verified: true
    });
    const person = db.doc("webmasters/person");
    await firebase.assertFails(person.get());
  });

  it("allow anyone to get the site theme", async () => {
    const db = getAuthedFirestore(null);
    const theme = db.doc("configuration/theme");
    await firebase.assertSucceeds(theme.get());
  });

  it("allow admins to edit the site theme", async () => {
    const db = getAuthedFirestore({
      uid: "admin",
      admin: true,
      webmaster: true,
      authorized: true,
      email_verified: true
    });
    const theme = db.doc("configuration/theme");
    await firebase.assertSucceeds(
      theme.set({ light: {}, dark: {} }, { merge: true })
    );
  });

  it("allow webmasters to edit the site theme", async () => {
    const db = getAuthedFirestore({
      uid: "webmaster",
      admin: false,
      webmaster: true,
      authorized: true,
      email_verified: true
    });
    const theme = db.doc("configuration/theme");
    await firebase.assertSucceeds(
      theme.set({ light: {}, dark: {} }, { merge: true })
    );
  });

  it("prevent incorrect theme structures", async () => {
    const db = getAuthedFirestore({
      uid: "admin",
      admin: true,
      webmaster: true,
      authorized: true,
      email_verified: true
    });
    const theme = db.doc("configuration/theme");
    await firebase.assertFails(theme.set({ badData: "" }));
  });

  it("prevent users from editing the site theme", async () => {
    const db = getAuthedFirestore({
      uid: "admin",
      admin: false,
      webmaster: false,
      authorized: true,
      email_verified: true
    });
    const theme = db.doc("configuration/theme");
    await firebase.assertFails(
      theme.set({ light: {}, dark: {} }, { merge: true })
    );
  });

  it("prevent unauthenticated users from editing the site theme", async () => {
    const db = getAuthedFirestore(null);
    const theme = db.doc("configuration/theme");
    await firebase.assertFails(
      theme.set({ light: {}, dark: {} }, { merge: true })
    );
  });

  it("allow anyone to get the site settings", async () => {
    const db = getAuthedFirestore(null);
    const settings = db.doc("configuration/settings");
    await firebase.assertSucceeds(settings.get());
  });

  it("allow authenticated users to get the private site settings", async () => {
    const db = getAuthedFirestore({
      uid: "person",
      authorized: true,
      email_verified: true
    });
    const settings = db.doc("configuration/priv-settings");
    await firebase.assertSucceeds(settings.get());
  });

  it("prevent unauthenticated users from getting the private site settings", async () => {
    const db = getAuthedFirestore(null);
    const settings = db.doc("configuration/priv-settings");
    await firebase.assertFails(settings.get());
  });

  it("allow admins to delete a settings document", async () => {
    const db = getAuthedFirestore({
      uid: "admin",
      admin: true,
      webmaster: true,
      authorized: true,
      email_verified: true
    });
    const settings = db.doc("configuration/settings");
    await firebase.assertSucceeds(settings.delete());
  });

  it("allow admins to create a settings document", async () => {
    const db = getAuthedFirestore({
      uid: "admin",
      admin: true,
      webmaster: true,
      authorized: true,
      email_verified: true
    });
    const settings = db.doc("configuration/settings");
    await firebase.assertSucceeds(
      settings.set(
        {
          calEdit: "",
          calURL: "",
          calView: "",
          defaultPage: "",
          email: "",
          footerTxt: "",
          mailURL: ""
        },
        { merge: true }
      )
    );
  });

  it("allow admins to delete a private settings document", async () => {
    const db = getAuthedFirestore({
      uid: "admin",
      admin: true,
      webmaster: true,
      authorized: true,
      email_verified: true
    });
    const settings = db.doc("configuration/priv-settings");
    await firebase.assertSucceeds(settings.delete());
  });

  it("allow webmasters to edit a settings document", async () => {
    const admin = getAdminApp();
    await admin.doc("configuration/settings").set({});
    const db = getAuthedFirestore({
      uid: "webmaster",
      admin: false,
      webmaster: true,
      authorized: true,
      email_verified: true
    });
    const doc = db.doc("configuration/settings");
    await firebase.assertSucceeds(
      doc.set(
        {
          calEdit: ""
        },
        { merge: true }
      )
    );
  });

  it("prevent incorrect settings document structures created by admins", async () => {
    const db = getAuthedFirestore({
      uid: "admin",
      admin: true,
      webmaster: true,
      authorized: true,
      email_verified: true
    });
    const doc = db.doc("configuration/settings");
    await firebase.assertFails(doc.set({ badData: "" }));
  });

  it("prevent incorrect settings document structures created by webmasters", async () => {
    const db = getAuthedFirestore({
      uid: "webmaster",
      admin: false,
      webmaster: true,
      authorized: true,
      email_verified: true
    });
    const doc = db.doc("configuration/settings");
    await firebase.assertFails(doc.set({ badData: "" }));
  });

  it("prevent users from editing a settings document", async () => {
    const db = getAuthedFirestore({
      uid: "user",
      admin: false,
      webmaster: false,
      authorized: true,
      email_verified: true
    });
    const doc = db.doc("configuration/settings");
    await firebase.assertFails(
      doc.set(
        {
          footerTxt: ""
        },
        { merge: true }
      )
    );
  });

  it("prevent unauthenticated users from editing a settings document", async () => {
    const db = getAuthedFirestore(null);
    const doc = db.doc("configuration/settings");
    await firebase.assertFails(
      doc.set(
        {
          footerTxt: ""
        },
        { merge: true }
      )
    );
  });

  it("allow admins to create a private settings document", async () => {
    const db = getAuthedFirestore({
      uid: "admin",
      admin: true,
      webmaster: true,
      authorized: true,
      email_verified: true
    });
    const settings = db.doc("configuration/priv-settings");
    await firebase.assertSucceeds(
      settings.set(
        {
          addresses: [],
          consoleURL: "",
          meetLink: "",
          linkHidden: false
        },
        { merge: true }
      )
    );
  });

  it("allow webmasters to edit a private settings document", async () => {
    const admin = getAdminApp();
    await admin.doc("configuration/priv-settings").set({});
    const db = getAuthedFirestore({
      uid: "webmaster",
      admin: false,
      webmaster: true,
      authorized: true,
      email_verified: true
    });
    const doc = db.doc("configuration/priv-settings");
    await firebase.assertSucceeds(
      doc.set(
        {
          meetLink: ""
        },
        { merge: true }
      )
    );
  });

  it("prevent incorrect private settings document structures created by admins", async () => {
    const db = getAuthedFirestore({
      uid: "admin",
      admin: true,
      webmaster: true,
      authorized: true,
      email_verified: true
    });
    const doc = db.doc("configuration/priv-settings");
    await firebase.assertFails(doc.set({ badData: "" }));
  });

  it("prevent incorrect private settings document structures created by webmasters", async () => {
    const admin = getAdminApp();
    await admin.doc("configuration/priv-settings").set({});
    const db = getAuthedFirestore({
      uid: "webmaster",
      admin: false,
      webmaster: true,
      authorized: true,
      email_verified: true
    });
    const doc = db.doc("configuration/priv-settings");
    await firebase.assertFails(doc.set({ badData: "" }));
  });

  it("prevent users from editing a private settings document", async () => {
    const db = getAuthedFirestore({
      uid: "user",
      admin: false,
      webmaster: false,
      authorized: true,
      email_verified: true
    });
    const doc = db.doc("configuration/priv-settings");
    await firebase.assertFails(
      doc.set(
        {
          meetLink: ""
        },
        { merge: true }
      )
    );
  });

  it("prevent unauthenticated users from editing a private settings document", async () => {
    const db = getAuthedFirestore(null);
    const doc = db.doc("configuration/priv-settings");
    await firebase.assertFails(
      doc.set(
        {
          meetLink: ""
        },
        { merge: true }
      )
    );
  });

  it("allow webmasters to view the documentation", async () => {
    const db = getAuthedFirestore({
      uid: "webmaster",
      admin: false,
      webmaster: true,
      authorized: true,
      email_verified: true
    });
    const docs = db.doc("configuration/documentation");
    await firebase.assertSucceeds(docs.get());
  });

  it("allow admins to view the documentation", async () => {
    const db = getAuthedFirestore({
      uid: "admin",
      admin: true,
      webmaster: true,
      authorized: true,
      email_verified: true
    });
    const docs = db.doc("configuration/documentation");
    await firebase.assertSucceeds(docs.get());
  });

  it("prevents users from viewing the documentation", async () => {
    const db = getAuthedFirestore({
      uid: "user",
      admin: false,
      webmaster: false,
      authorized: true,
      email_verified: true
    });
    const docs = db.doc("configuration/documentation");
    await firebase.assertFails(docs.get());
  });

  it("prevents unauthenticated users from viewing the documentation", async () => {
    const db = getAuthedFirestore(null);
    const docs = db.doc("configuration/documentation");
    await firebase.assertFails(docs.get());
  });

  it("prevents anyone from editing the documentation", async () => {
    const db = getAuthedFirestore({
      uid: "admin",
      admin: true,
      webmaster: true,
      authorized: true,
      email_verified: true
    });
    const docs = db.doc("configuration/documentation");
    await firebase.assertFails(docs.set({}));
  });

  it("allow admins to view the calendar editing password", async () => {
    const db = getAuthedFirestore({
      uid: "admin",
      admin: true,
      webmaster: true,
      authorized: true,
      email_verified: true
    });
    const doc = db.doc("configuration/apps-script-cal-edit");
    await firebase.assertSucceeds(doc.get());
  });

  it("allow webmasters to view the calendar editing password", async () => {
    const db = getAuthedFirestore({
      uid: "webmaster",
      admin: false,
      webmaster: true,
      authorized: true,
      email_verified: true
    });
    const doc = db.doc("configuration/apps-script-cal-edit");
    await firebase.assertSucceeds(doc.get());
  });

  it("prevent users from viewing the calendar editing password if the permissions are set to webmasters", async () => {
    const admin = getAdminApp();
    await admin.doc("configuration/settings").set({
      calEdit: "webmasters"
    });
    const db = getAuthedFirestore({
      uid: "user",
      admin: false,
      webmaster: false,
      authorized: true,
      email_verified: true
    });
    const doc = db.doc("configuration/apps-script-cal-edit");
    await firebase.assertFails(doc.get());
  });

  it("prevent unauthenticated users from viewing the calendar editing password if the permissions are set to webmasters", async () => {
    const admin = getAdminApp();
    await admin.doc("configuration/settings").set({
      calEdit: "webmasters"
    });
    const db = getAuthedFirestore(null);
    const doc = db.doc("configuration/apps-script-cal-edit");
    await firebase.assertFails(doc.get());
  });

  it("allow users to view the calendar editing password if the permissions are set to users", async () => {
    const admin = getAdminApp();
    await admin.doc("configuration/settings").set({
      calEdit: "users"
    });
    const db = getAuthedFirestore({
      uid: "user",
      admin: false,
      webmaster: false,
      authorized: true,
      email_verified: true
    });
    const doc = db.doc("configuration/apps-script-cal-edit");
    await firebase.assertSucceeds(doc.get());
  });

  it("prevent unauthenticated users from viewing the calendar editing password if the permissions are set to users", async () => {
    const admin = getAdminApp();
    await admin.doc("configuration/settings").set({
      calEdit: "users"
    });
    const db = getAuthedFirestore(null);
    const doc = db.doc("configuration/apps-script-cal-edit");
    await firebase.assertFails(doc.get());
  });

  it("allow users to view the calendar editing password if the permissions are set to public", async () => {
    const admin = getAdminApp();
    await admin.doc("configuration/settings").set({
      calEdit: "public"
    });
    const db = getAuthedFirestore({
      uid: "user",
      admin: false,
      webmaster: false,
      authorized: true,
      email_verified: true
    });
    const doc = db.doc("configuration/apps-script-cal-edit");
    await firebase.assertSucceeds(doc.get());
  });

  it("allow unauthenticated users to view the calendar editing password if the permissions are set to public", async () => {
    const admin = getAdminApp();
    await admin.doc("configuration/settings").set({
      calEdit: "public"
    });
    const db = getAuthedFirestore(null);
    const doc = db.doc("configuration/apps-script-cal-edit");
    await firebase.assertSucceeds(doc.get());
  });

  it("allow admins to view the calendar viewing password", async () => {
    const db = getAuthedFirestore({
      uid: "admin",
      admin: true,
      webmaster: true,
      authorized: true,
      email_verified: true
    });
    const doc = db.doc("configuration/apps-script-cal-view");
    await firebase.assertSucceeds(doc.get());
  });

  it("allow webmasters to view the calendar viewing password", async () => {
    const db = getAuthedFirestore({
      uid: "webmaster",
      admin: false,
      webmaster: true,
      authorized: true,
      email_verified: true
    });
    const doc = db.doc("configuration/apps-script-cal-view");
    await firebase.assertSucceeds(doc.get());
  });

  it("prevent users from viewing the calendar viewing password if the permissions are set to webmasters", async () => {
    const admin = getAdminApp();
    await admin.doc("configuration/settings").set({
      calView: "webmasters"
    });
    const db = getAuthedFirestore({
      uid: "user",
      admin: false,
      webmaster: false,
      authorized: true,
      email_verified: true
    });
    const doc = db.doc("configuration/apps-script-cal-view");
    await firebase.assertFails(doc.get());
  });

  it("prevent unauthenticated users from viewing the calendar viewing password if the permissions are set to webmasters", async () => {
    const admin = getAdminApp();
    await admin.doc("configuration/settings").set({
      calView: "webmasters"
    });
    const db = getAuthedFirestore(null);
    const doc = db.doc("configuration/apps-script-cal-view");
    await firebase.assertFails(doc.get());
  });

  it("allow users to view the calendar viewing password if the permissions are set to users", async () => {
    const admin = getAdminApp();
    await admin.doc("configuration/settings").set({
      calView: "users"
    });
    const db = getAuthedFirestore({
      uid: "user",
      admin: false,
      webmaster: false,
      authorized: true,
      email_verified: true
    });
    const doc = db.doc("configuration/apps-script-cal-view");
    await firebase.assertSucceeds(doc.get());
  });

  it("prevent unauthenticated users from viewing the calendar viewing password if the permissions are set to users", async () => {
    const admin = getAdminApp();
    await admin.doc("configuration/settings").set({
      calView: "users"
    });
    const db = getAuthedFirestore(null);
    const doc = db.doc("configuration/apps-script-cal-view");
    await firebase.assertFails(doc.get());
  });

  it("allow users to view the calendar viewing password if the permissions are set to public", async () => {
    const admin = getAdminApp();
    await admin.doc("configuration/settings").set({
      calView: "public"
    });
    const db = getAuthedFirestore({
      uid: "user",
      admin: false,
      webmaster: false,
      authorized: true,
      email_verified: true
    });
    const doc = db.doc("configuration/apps-script-cal-view");
    await firebase.assertSucceeds(doc.get());
  });

  it("allow unauthenticated users to view the calendar viewing password if the permissions are set to public", async () => {
    const admin = getAdminApp();
    await admin.doc("configuration/settings").set({
      calView: "public"
    });
    const db = getAuthedFirestore(null);
    const doc = db.doc("configuration/apps-script-cal-view");
    await firebase.assertSucceeds(doc.get());
  });

  it("allow admins to view the emailing password", async () => {
    const db = getAuthedFirestore({
      uid: "admin",
      admin: true,
      webmaster: true,
      authorized: true,
      email_verified: true
    });
    const doc = db.doc("configuration/apps-script-mail");
    await firebase.assertSucceeds(doc.get());
  });

  it("allow webmasters to view the emailing password", async () => {
    const db = getAuthedFirestore({
      uid: "webmaster",
      admin: false,
      webmaster: true,
      authorized: true,
      email_verified: true
    });
    const doc = db.doc("configuration/apps-script-mail");
    await firebase.assertSucceeds(doc.get());
  });

  it("prevent users from viewing the emailing password if the permissions are set to webmasters", async () => {
    const admin = getAdminApp();
    await admin.doc("configuration/settings").set({
      email: "webmasters"
    });
    const db = getAuthedFirestore({
      uid: "user",
      admin: false,
      webmaster: false,
      authorized: true,
      email_verified: true
    });
    const doc = db.doc("configuration/apps-script-mail");
    await firebase.assertFails(doc.get());
  });

  it("prevent unauthenticated users from viewing the emailing password if the permissions are set to webmasters", async () => {
    const admin = getAdminApp();
    await admin.doc("configuration/settings").set({
      email: "webmasters"
    });
    const db = getAuthedFirestore(null);
    const doc = db.doc("configuration/apps-script-mail");
    await firebase.assertFails(doc.get());
  });

  it("allow users to view the emailing password if the permissions are set to users", async () => {
    const admin = getAdminApp();
    await admin.doc("configuration/settings").set({
      email: "users"
    });
    const db = getAuthedFirestore({
      uid: "user",
      admin: false,
      webmaster: false,
      authorized: true,
      email_verified: true
    });
    const doc = db.doc("configuration/apps-script-mail");
    await firebase.assertSucceeds(doc.get());
  });

  it("prevent unauthenticated users from viewing the emailing password if the permissions are set to users", async () => {
    const admin = getAdminApp();
    await admin.doc("configuration/settings").set({
      email: "users"
    });
    const db = getAuthedFirestore(null);
    const doc = db.doc("configuration/apps-script-mail");
    await firebase.assertFails(doc.get());
  });

  it("allow users to view the emailing password if the permissions are set to public", async () => {
    const admin = getAdminApp();
    await admin.doc("configuration/settings").set({
      email: "public"
    });
    const db = getAuthedFirestore({
      uid: "user",
      admin: false,
      webmaster: false,
      authorized: true,
      email_verified: true
    });
    const doc = db.doc("configuration/apps-script-mail");
    await firebase.assertSucceeds(doc.get());
  });

  it("allow unauthenticated users to view the emailing password if the permissions are set to public", async () => {
    const admin = getAdminApp();
    await admin.doc("configuration/settings").set({
      email: "public"
    });
    const db = getAuthedFirestore(null);
    const doc = db.doc("configuration/apps-script-mail");
    await firebase.assertSucceeds(doc.get());
  });
});
