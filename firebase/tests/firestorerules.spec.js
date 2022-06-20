const {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment
} = require("@firebase/rules-unit-testing");
const {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  setDoc,
  setLogLevel
} = require("firebase/firestore");
const { createWriteStream, readFileSync } = require("fs");
const { get } = require("http");

let testEnv;

before(async () => {
  setLogLevel("error");
  testEnv = await initializeTestEnvironment({
    firestore: {
      rules: readFileSync("../firestore.rules", "utf8")
    }
  });
});

after(async () => {
  await testEnv.cleanup();
  const coverageFile = "firestore-coverage.html";
  const fstream = createWriteStream(coverageFile);
  await new Promise((resolve, reject) => {
    const { host, port } = testEnv.emulators.firestore;
    const quotedHost = host.includes(":") ? `[${host}]` : host;
    get(
      `http://${quotedHost}:${port}/emulator/v1/projects/${testEnv.projectId}:ruleCoverage.html`,
      (res) => {
        res.pipe(fstream, { end: true });
        res.on("end", resolve);
        res.on("error", reject);
      }
    );
  });

  console.log(`View firestore rule coverage information at ${coverageFile}\n`);
});

beforeEach(async () => {
  await testEnv.clearFirestore();
  await testEnv.withSecurityRulesDisabled(async (context) => {
    await setDoc(doc(context.firestore(), "pages/page1"), {
      dbPath: "/page1",
      id: "page1",
      index: 0,
      name: "Test Page 1",
      permissions: "webmasters"
    });
  });
  await testEnv.withSecurityRulesDisabled(async (context) => {
    await setDoc(doc(context.firestore(), "pages/page2"), {
      dbPath: "/page2",
      id: "page2",
      index: 1,
      name: "Test Page 2",
      permissions: "users"
    });
  });
  await testEnv.withSecurityRulesDisabled(async (context) => {
    await setDoc(doc(context.firestore(), "pages/page3"), {
      dbPath: "/page3",
      id: "page3",
      index: 2,
      name: "Test Page 3",
      permissions: "public"
    });
  });
});

describe("Firestore Security Rules", () => {
  it("allow any user to get the special page sitemap", async () => {
    await assertSucceeds(
      getDocs(collection(testEnv.unauthenticatedContext().firestore(), "pages"))
    );
  });

  it("allow admins to edit the special page sitemap", async () => {
    await assertSucceeds(
      setDoc(
        doc(
          testEnv
            .authenticatedContext("admin", {
              admin: true,
              webmaster: true,
              authorized: true,
              email_verified: true
            })
            .firestore(),
          "pages/page"
        ),
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
    await assertSucceeds(
      setDoc(
        doc(
          testEnv
            .authenticatedContext("webmaster", {
              admin: false,
              webmaster: true,
              authorized: true,
              email_verified: true
            })
            .firestore(),
          "pages/page"
        ),
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
    await assertFails(
      setDoc(
        doc(
          testEnv
            .authenticatedContext("admin", {
              admin: true,
              webmaster: true,
              authorized: true,
              email_verified: true
            })
            .firestore(),
          "pages/page"
        ),
        {
          badData: "hello"
        }
      )
    );
  });

  it("prevent users from editing the special page sitemap", async () => {
    await assertFails(
      setDoc(
        doc(
          testEnv
            .authenticatedContext("user", {
              admin: false,
              webmaster: false,
              authorized: true,
              email_verified: true
            })
            .firestore(),
          "pages/page"
        ),
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
    await assertFails(
      setDoc(
        doc(testEnv.unauthenticatedContext().firestore(), "pages/page"),
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
    await assertSucceeds(
      getDocs(
        collection(
          testEnv
            .authenticatedContext("admin", {
              admin: true,
              webmaster: true,
              authorized: true,
              email_verified: true
            })
            .firestore(),
          "pages/page1/components"
        )
      )
    );
  });

  it("allow webmasters to view special page data", async () => {
    await assertSucceeds(
      getDocs(
        collection(
          testEnv
            .authenticatedContext("webmaster", {
              admin: false,
              webmaster: true,
              authorized: true,
              email_verified: true
            })
            .firestore(),
          "pages/page1/components"
        )
      )
    );
  });

  it("prevent users from viewing special page data that has webmaster permissions", async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), "pages/page1/components/comp"), {
        data: {
          hidden: false
        }
      });
    });
    await assertFails(
      getDoc(
        doc(
          testEnv
            .authenticatedContext("user", {
              admin: false,
              webmaster: false,
              authorized: true,
              email_verified: true
            })
            .firestore(),
          "pages/page1/components/comp"
        )
      )
    );
  });

  it("prevent unauthenticated users from viewing special page data that has webmaster permissions", async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), "pages/page1/components/comp"), {
        data: {
          hidden: false
        }
      });
    });
    await assertFails(
      getDoc(
        doc(
          testEnv.unauthenticatedContext().firestore(),
          "pages/page1/components/comp"
        )
      )
    );
  });

  it("allow users to view special page data that has user permissions", async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), "pages/page2/components/comp"), {
        data: {
          hidden: false
        }
      });
    });
    await assertSucceeds(
      getDoc(
        doc(
          testEnv
            .authenticatedContext("user", {
              admin: false,
              webmaster: false,
              authorized: true,
              email_verified: true
            })
            .firestore(),
          "pages/page2/components/comp"
        )
      )
    );
  });

  it("prevent unauthenticated users from viewing special page data that has user permissions", async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), "pages/page2/components/comp"), {
        data: {
          hidden: false
        }
      });
    });
    await assertFails(
      getDoc(
        doc(
          testEnv.unauthenticatedContext().firestore(),
          "pages/page2/components/comp"
        )
      )
    );
  });

  it("allow users to view special page data that has public permissions", async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), "pages/page3/components/comp"), {
        data: {
          hidden: false
        }
      });
    });
    await assertSucceeds(
      getDoc(
        doc(
          testEnv
            .authenticatedContext("user", {
              admin: false,
              webmaster: false,
              authorized: true,
              email_verified: true
            })
            .firestore(),
          "pages/page3/components/comp"
        )
      )
    );
  });

  it("allow unauthenticated users to view special page data that has public permissions", async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), "pages/page3/components/comp"), {
        data: {
          hidden: false
        }
      });
    });
    await assertSucceeds(
      getDoc(
        doc(
          testEnv.unauthenticatedContext().firestore(),
          "pages/page3/components/comp"
        )
      )
    );
  });

  it("prevent users from viewing special page data that has user permissions and is hidden", async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), "pages/page2/components/comp"), {
        data: {
          hidden: true
        }
      });
    });
    await assertFails(
      getDoc(
        doc(
          testEnv
            .authenticatedContext("user", {
              admin: false,
              webmaster: false,
              authorized: true,
              email_verified: true
            })
            .firestore(),
          "pages/page2/components/comp"
        )
      )
    );
  });

  it("prevent users from viewing special page data that has public permissions and is hidden", async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), "pages/page3/components/comp"), {
        data: {
          hidden: true
        }
      });
    });
    await assertFails(
      getDoc(
        doc(
          testEnv
            .authenticatedContext("user", {
              admin: false,
              webmaster: false,
              authorized: true,
              email_verified: true
            })
            .firestore(),
          "pages/page3/components/comp"
        )
      )
    );
  });

  it("prevents unauthenticated users from viewing special page data that has public permissions and is hidden", async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), "pages/page3/components/comp"), {
        data: {
          hidden: true
        }
      });
    });
    await assertFails(
      getDoc(
        doc(
          testEnv.unauthenticatedContext().firestore(),
          "pages/page3/components/comp"
        )
      )
    );
  });

  it("allow admins to edit special page data", async () => {
    await assertSucceeds(
      setDoc(
        doc(
          testEnv
            .authenticatedContext("admin", {
              admin: true,
              webmaster: true,
              authorized: true,
              email_verified: true
            })
            .firestore(),
          "pages/page1/components/comp"
        ),
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
    await assertSucceeds(
      setDoc(
        doc(
          testEnv
            .authenticatedContext("webmaster", {
              admin: false,
              webmaster: true,
              authorized: true,
              email_verified: true
            })
            .firestore(),
          "pages/page1/components/comp"
        ),
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
    await assertFails(
      setDoc(
        doc(
          testEnv
            .authenticatedContext("admin", {
              admin: true,
              webmaster: true,
              authorized: true,
              email_verified: true
            })
            .firestore(),
          "pages/page1/components/comp"
        ),
        {
          badData: "hello"
        }
      )
    );
  });

  it("prevent users from editing special page data", async () => {
    await assertFails(
      setDoc(
        doc(
          testEnv
            .authenticatedContext("user", {
              admin: false,
              webmaster: false,
              authorized: true,
              email_verified: true
            })
            .firestore(),
          "pages/page1/components/comp"
        ),
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
    await assertFails(
      setDoc(
        doc(
          testEnv.unauthenticatedContext().firestore(),
          "pages/page1/components/comp"
        ),
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
    await assertSucceeds(
      getDoc(
        doc(
          testEnv
            .authenticatedContext("admin", {
              admin: true,
              webmaster: true,
              authorized: true,
              email_verified: true
            })
            .firestore(),
          "pages/page1/components/comp/data/item"
        )
      )
    );
  });

  it("allow webmasters to view special page inner component data", async () => {
    await assertSucceeds(
      getDoc(
        doc(
          testEnv
            .authenticatedContext("webmaster", {
              admin: false,
              webmaster: true,
              authorized: true,
              email_verified: true
            })
            .firestore(),
          "pages/page1/components/comp/data/item"
        )
      )
    );
  });

  it("prevent users from viewing special page inner component data that has webmaster permissions", async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const db = context.firestore();
      await setDoc(doc(db, "pages/page1/components/comp"), {
        data: {
          hidden: false
        }
      });

      await setDoc(doc(db, "pages/page1/components/comp/data/item"), {
        hello: "hi"
      });
    });
    await assertFails(
      getDoc(
        doc(
          testEnv
            .authenticatedContext("user", {
              admin: false,
              webmaster: false,
              authorized: true,
              email_verified: true
            })
            .firestore(),
          "pages/page1/components/comp/data/item"
        )
      )
    );
  });

  it("prevent unauthenticated users from viewing special page inner component data that has webmaster permissions", async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const db = context.firestore();
      await setDoc(doc(db, "pages/page1/components/comp"), {
        data: {
          hidden: false
        }
      });

      await setDoc(doc(db, "pages/page1/components/comp/data/item"), {
        hello: "hi"
      });
    });
    await assertFails(
      getDoc(
        doc(
          testEnv.unauthenticatedContext().firestore(),
          "pages/page1/components/comp/data/item"
        )
      )
    );
  });

  it("allow users to view special page inner component data that has user permissions", async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const db = context.firestore();
      await setDoc(doc(db, "pages/page2/components/comp"), {
        data: {
          hidden: false
        }
      });

      await setDoc(doc(db, "pages/page2/components/comp/data/item"), {
        hello: "hi"
      });
    });
    await assertSucceeds(
      getDoc(
        doc(
          testEnv
            .authenticatedContext("user", {
              admin: false,
              webmaster: false,
              authorized: true,
              email_verified: true
            })
            .firestore(),
          "pages/page2/components/comp/data/item"
        )
      )
    );
  });

  it("allow users to view special page subcomponent data that has user permissions and is not hidden", async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const db = context.firestore();
      await setDoc(doc(db, "pages/page2/components/comp"), {
        data: {
          hidden: false
        }
      });

      await setDoc(doc(db, "pages/page2/components/comp/data/item"), {
        data: {
          hidden: false
        }
      });
    });
    await assertSucceeds(
      getDoc(
        doc(
          testEnv
            .authenticatedContext("user", {
              admin: false,
              webmaster: false,
              authorized: true,
              email_verified: true
            })
            .firestore(),
          "pages/page2/components/comp/data/item"
        )
      )
    );
  });

  it("prevent users from viewing special page subcomponent data that has user permissions and is hidden", async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const db = context.firestore();
      await setDoc(doc(db, "pages/page2/components/comp"), {
        data: {
          hidden: false
        }
      });

      await setDoc(doc(db, "pages/page2/components/comp/data/item"), {
        data: {
          hidden: true
        }
      });
    });
    await assertFails(
      getDoc(
        doc(
          testEnv
            .authenticatedContext("user", {
              admin: false,
              webmaster: false,
              authorized: true,
              email_verified: true
            })
            .firestore(),
          "pages/page2/components/comp/data/item"
        )
      )
    );
  });

  it("prevent unauthenticated users from viewing special page inner component data that has user permissions", async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const db = context.firestore();
      await setDoc(doc(db, "pages/page2/components/comp"), {
        data: {
          hidden: false
        }
      });

      await setDoc(doc(db, "pages/page2/components/comp/data/item"), {
        hello: "hi"
      });
    });
    await assertFails(
      getDoc(
        doc(
          testEnv.unauthenticatedContext().firestore(),
          "pages/page2/components/comp/data/item"
        )
      )
    );
  });

  it("allow unauthenticated users to view special page inner component data that has public permissions", async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const db = context.firestore();
      await setDoc(doc(db, "pages/page3/components/comp"), {
        data: {
          hidden: false
        }
      });

      await setDoc(doc(db, "pages/page3/components/comp/data/item"), {
        hello: "hi"
      });
    });
    await assertSucceeds(
      getDoc(
        doc(
          testEnv.unauthenticatedContext().firestore(),
          "pages/page3/components/comp/data/item"
        )
      )
    );
  });

  it("allow unauthenticated users to view special page subcomponent data that has public permissions and is not hidden", async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const db = context.firestore();
      await setDoc(doc(db, "pages/page3/components/comp"), {
        data: {
          hidden: false
        }
      });

      await setDoc(doc(db, "pages/page3/components/comp/data/item"), {
        data: {
          hidden: false
        }
      });
    });
    await assertSucceeds(
      getDoc(
        doc(
          testEnv.unauthenticatedContext().firestore(),
          "pages/page3/components/comp/data/item"
        )
      )
    );
  });

  it("prevent unauthenticated users from viewing special page subcomponent data that has public permissions and is hidden", async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const db = context.firestore();
      await setDoc(doc(db, "pages/page3/components/comp"), {
        data: {
          hidden: false
        }
      });

      await setDoc(doc(db, "pages/page3/components/comp/data/item"), {
        data: {
          hidden: true
        }
      });
    });
    await assertFails(
      getDoc(
        doc(
          testEnv.unauthenticatedContext().firestore(),
          "pages/page3/components/comp/data/item"
        )
      )
    );
  });

  it("allow users to view special page inner component data that has public permissions", async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const db = context.firestore();
      await setDoc(doc(db, "pages/page3/components/comp"), {
        data: {
          hidden: false
        }
      });

      await setDoc(doc(db, "pages/page3/components/comp/data/item"), {
        hello: "hi"
      });
    });
    await assertSucceeds(
      getDoc(
        doc(
          testEnv
            .authenticatedContext("user", {
              admin: false,
              webmaster: false,
              authorized: true,
              email_verified: true
            })
            .firestore(),
          "pages/page3/components/comp/data/item"
        )
      )
    );
  });

  it("allow users to view special page subcomponent data that has public permissions and is not hidden", async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const db = context.firestore();
      await setDoc(doc(db, "pages/page3/components/comp"), {
        data: {
          hidden: false
        }
      });

      await setDoc(doc(db, "pages/page3/components/comp/data/item"), {
        data: {
          hidden: false
        }
      });
    });
    await assertSucceeds(
      getDoc(
        doc(
          testEnv
            .authenticatedContext("user", {
              admin: false,
              webmaster: false,
              authorized: true,
              email_verified: true
            })
            .firestore(),
          "pages/page3/components/comp/data/item"
        )
      )
    );
  });

  it("prevent users from viewing special page subcomponent data that has public permissions and is hidden", async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const db = context.firestore();
      await setDoc(doc(db, "pages/page3/components/comp"), {
        data: {
          hidden: false
        }
      });

      await setDoc(doc(db, "pages/page3/components/comp/data/item"), {
        data: {
          hidden: true
        }
      });
    });
    await assertFails(
      getDoc(
        doc(
          testEnv
            .authenticatedContext("user", {
              admin: false,
              webmaster: false,
              authorized: true,
              email_verified: true
            })
            .firestore(),
          "pages/page3/components/comp/data/item"
        )
      )
    );
  });

  it("prevent users from viewing special page inner component data on hidden components", async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), "pages/page3/components/comp"), {
        data: {
          hidden: true
        }
      });
    });
    await assertFails(
      getDoc(
        doc(
          testEnv
            .authenticatedContext("user", {
              admin: false,
              webmaster: false,
              authorized: true,
              email_verified: true
            })
            .firestore(),
          "pages/page3/components/comp/data/item"
        )
      )
    );
  });

  it("prevent unauthenticated users from viewing special page inner component data on hidden components", async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), "pages/page3/components/comp"), {
        data: {
          hidden: true
        }
      });
    });
    await assertFails(
      getDoc(
        doc(
          testEnv.unauthenticatedContext().firestore(),
          "pages/page3/components/comp/data/item"
        )
      )
    );
  });

  it("allow admins to edit special page inner component data", async () => {
    await assertSucceeds(
      setDoc(
        doc(
          testEnv
            .authenticatedContext("admin", {
              admin: true,
              webmaster: true,
              authorized: true,
              email_verified: true
            })
            .firestore(),
          "pages/page1/components/comp/data/item"
        ),
        {
          components: []
        },
        { merge: true }
      )
    );
  });

  it("allow webmasters to edit special page inner component data", async () => {
    await assertSucceeds(
      setDoc(
        doc(
          testEnv
            .authenticatedContext("webmaster", {
              admin: false,
              webmaster: true,
              authorized: true,
              email_verified: true
            })
            .firestore(),
          "pages/page1/components/comp/data/item"
        ),
        {
          components: []
        },
        { merge: true }
      )
    );
  });

  it("allow users to create special page inner component data that has user permissions and their uid", async () => {
    await assertSucceeds(
      setDoc(
        doc(
          testEnv
            .authenticatedContext("user1", {
              admin: false,
              webmaster: false,
              authorized: true,
              email_verified: true
            })
            .firestore(),
          "pages/page2/components/comp/data/item"
        ),
        {
          uid: "user1"
        },
        { merge: true }
      )
    );
  });

  it("prevent users from editing another user's special page inner component data except comments that has user permissions", async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await setDoc(
        doc(context.firestore(), "pages/page2/components/comp/data/item"),
        {
          uid: "user1"
        }
      );
    });

    await assertFails(
      setDoc(
        doc(
          testEnv
            .authenticatedContext("user2", {
              admin: false,
              webmaster: false,
              authorized: true,
              email_verified: true
            })
            .firestore(),
          "pages/page2/components/comp/data/item"
        ),
        {
          uid: "user1",
          newData: ""
        },
        { merge: true }
      )
    );
  });

  it("allow users to edit another user's special page inner component data comments that has user permissions", async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await setDoc(
        doc(context.firestore(), "pages/page2/components/comp/data/item"),
        {
          uid: "user1",
          comments: []
        }
      );
    });

    await assertSucceeds(
      setDoc(
        doc(
          testEnv
            .authenticatedContext("user2", {
              admin: false,
              webmaster: false,
              authorized: true,
              email_verified: true
            })
            .firestore(),
          "pages/page2/components/comp/data/item"
        ),
        {
          comments: ["hi"]
        },
        { merge: true }
      )
    );
  });

  it("prevent users from deleting another user's special page inner component data that has user permissions", async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await setDoc(
        doc(context.firestore(), "pages/page2/components/comp/data/item"),
        {
          uid: "user1"
        }
      );
    });

    await assertFails(
      deleteDoc(
        doc(
          testEnv
            .authenticatedContext("user2", {
              admin: false,
              webmaster: false,
              authorized: true,
              email_verified: true
            })
            .firestore(),
          "pages/page2/components/comp/data/item"
        )
      )
    );
  });

  it("prevent users from creating special page inner component data without their uid that has user permissions", async () => {
    await assertFails(
      setDoc(
        doc(
          testEnv
            .authenticatedContext("user", {
              admin: false,
              webmaster: false,
              authorized: true,
              email_verified: true
            })
            .firestore(),
          "pages/page2/components/comp/data/item"
        ),
        {},
        { merge: true }
      )
    );
  });

  it("allow users to create special page inner component data that has public permissions and their uid", async () => {
    await assertSucceeds(
      setDoc(
        doc(
          testEnv
            .authenticatedContext("user1", {
              admin: false,
              webmaster: false,
              authorized: true,
              email_verified: true
            })
            .firestore(),
          "pages/page3/components/comp/data/item"
        ),
        {
          uid: "user1"
        },
        { merge: true }
      )
    );
  });

  it("prevent users from editing another user's special page inner component data except comments that has public permissions", async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await setDoc(
        doc(context.firestore(), "pages/page3/components/comp/data/item"),
        {
          uid: "user1"
        }
      );
    });

    await assertFails(
      setDoc(
        doc(
          testEnv
            .authenticatedContext("user2", {
              admin: false,
              webmaster: false,
              authorized: true,
              email_verified: true
            })
            .firestore(),
          "pages/page3/components/comp/data/item"
        ),
        {
          uid: "me"
        },
        { merge: true }
      )
    );
  });

  it("allow users to edit another user's special page inner component data comments that has public permissions", async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await setDoc(
        doc(context.firestore(), "pages/page3/components/comp/data/item"),
        {
          uid: "user1",
          comments: []
        }
      );
    });

    await assertSucceeds(
      setDoc(
        doc(
          testEnv
            .authenticatedContext("user2", {
              admin: false,
              webmaster: false,
              authorized: true,
              email_verified: true
            })
            .firestore(),
          "pages/page3/components/comp/data/item"
        ),
        {
          comments: ["hi"]
        },
        { merge: true }
      )
    );
  });

  it("prevent users from deleting another user's special page inner component data that has public permissions", async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await setDoc(
        doc(context.firestore(), "pages/page3/components/comp/data/item"),
        {
          uid: "user1"
        }
      );
    });

    await assertFails(
      deleteDoc(
        doc(
          testEnv
            .authenticatedContext("user2", {
              admin: false,
              webmaster: false,
              authorized: true,
              email_verified: true
            })
            .firestore(),
          "pages/page3/components/comp/data/item"
        )
      )
    );
  });

  it("prevent users from creating special page inner component data without their uid that has public permissions", async () => {
    await assertFails(
      setDoc(
        doc(
          testEnv
            .authenticatedContext("user", {
              admin: false,
              webmaster: false,
              authorized: true,
              email_verified: true
            })
            .firestore(),
          "pages/page3/components/comp/data/item"
        ),
        {},
        { merge: true }
      )
    );
  });

  it("prevent users from viewing someone else's profile information", async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      setDoc(doc(context.firestore(), "users/person1"), {
        disabled: false,
        displayName: "new",
        email: "test@test.com",
        permissions: "User",
        photoURL: ""
      });
    });
    await assertFails(
      getDoc(
        doc(
          testEnv
            .authenticatedContext("person", {
              authorized: true,
              email_verified: true
            })
            .firestore(),
          "users/person1"
        )
      )
    );
  });

  it("allow users to view their own profile information.", async () => {
    await assertSucceeds(
      getDoc(
        doc(
          testEnv
            .authenticatedContext("person", {
              authorized: true,
              email_verified: true
            })
            .firestore(),
          "users/person"
        )
      )
    );
  });

  it("prevent unauthenticated users from viewing profile information", async () => {
    await assertFails(
      getDocs(collection(testEnv.unauthenticatedContext().firestore(), "users"))
    );
  });

  it("allow users to edit their own profile if their email is verified", async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), "users/person"), {
        disabled: false,
        displayName: "new",
        email: "test@test.com",
        permissions: "User",
        photoURL: ""
      });
    });

    await assertSucceeds(
      setDoc(
        doc(
          testEnv
            .authenticatedContext("person", {
              authorized: true,
              email_verified: true
            })
            .firestore(),
          "users/person"
        ),
        {
          displayName: "person"
        },
        { merge: true }
      )
    );
  });

  it("prevent users from editing restricted fields in their profile", async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), "users/person"), {
        disabled: false,
        displayName: "new",
        email: "test@test.com",
        permissions: "User",
        photoURL: ""
      });
    });

    await assertFails(
      setDoc(
        doc(
          testEnv
            .authenticatedContext("person", {
              authorized: true,
              email_verified: true
            })
            .firestore(),
          "users/person"
        ),
        {
          permissions: "admin"
        },
        { merge: true }
      )
    );
  });

  it("prevent users from editing their own profile if their email is not verified", async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), "users/person"), {
        disabled: false,
        displayName: "new",
        email: "test@test.com",
        permissions: "User",
        photoURL: ""
      });
    });

    await assertFails(
      setDoc(
        doc(
          testEnv
            .authenticatedContext("person", {
              authorized: true,
              email_verified: false
            })
            .firestore(),
          "users/person"
        ),
        {
          displayName: "person"
        },
        { merge: true }
      )
    );
  });

  it("prevent users from editing their own profile if they are not authorized", async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), "users/person"), {
        disabled: false,
        displayName: "new",
        email: "test@test.com",
        permissions: "User",
        photoURL: ""
      });
    });

    await assertFails(
      setDoc(
        doc(
          testEnv
            .authenticatedContext("person", {
              authorized: false,
              email_verified: true
            })
            .firestore(),
          "users/person"
        ),
        {
          displayName: "person"
        },
        { merge: true }
      )
    );
  });

  it("prevent users from editing other user profiles", async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), "users/person"), {
        disabled: false,
        displayName: "new",
        email: "test@test.com",
        permissions: "User",
        photoURL: ""
      });
    });

    await assertFails(
      setDoc(
        doc(
          testEnv
            .authenticatedContext("maliciousUser", {
              authorized: true,
              email_verified: true
            })
            .firestore(),
          "users/person"
        ),
        {
          displayName: "person"
        },
        { merge: true }
      )
    );
  });

  it("allow admins to view user profiles", async () => {
    await assertSucceeds(
      getDoc(
        doc(
          testEnv
            .authenticatedContext("admin", {
              admin: true,
              webmaster: true,
              authorized: true,
              email_verified: true
            })
            .firestore(),
          "users/some-user"
        )
      )
    );
  });

  it("allow admins to edit user profiles", async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), "users/some-user"), {
        disabled: false,
        displayName: "new",
        email: "test@test.com",
        permissions: "User",
        photoURL: ""
      });
    });

    await assertSucceeds(
      setDoc(
        doc(
          testEnv
            .authenticatedContext("admin", {
              admin: true,
              webmaster: true,
              authorized: true,
              email_verified: true
            })
            .firestore(),
          "users/some-user"
        ),
        {
          displayName: "Updated"
        },
        { merge: true }
      )
    );
  });

  it("prevent webmasters from editing user profiles", async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), "users/some-user"), {
        disabled: false,
        displayName: "new",
        email: "test@test.com",
        permissions: "User",
        photoURL: ""
      });
    });

    await assertFails(
      setDoc(
        doc(
          testEnv
            .authenticatedContext("webmaster", {
              admin: false,
              webmaster: true,
              authorized: true,
              email_verified: true
            })
            .firestore(),
          "users/some-user"
        ),
        {
          displayName: "Updated"
        },
        { merge: true }
      )
    );
  });

  it("allow admins to edit the admin collection", async () => {
    await assertSucceeds(
      setDoc(
        doc(
          testEnv
            .authenticatedContext("admin", {
              admin: true,
              webmaster: true,
              authorized: true,
              email_verified: true
            })
            .firestore(),
          "admin/person"
        ),
        {
          name: "Person"
        },
        { merge: true }
      )
    );
  });

  it("allow admins to read the admin collection", async () => {
    await assertSucceeds(
      getDoc(
        doc(
          testEnv
            .authenticatedContext("admin", {
              admin: true,
              webmaster: true,
              authorized: true,
              email_verified: true
            })
            .firestore(),
          "admin/person"
        )
      )
    );
  });

  it("allow admins to edit the webmasters collection", async () => {
    await assertSucceeds(
      setDoc(
        doc(
          testEnv
            .authenticatedContext("admin", {
              admin: true,
              webmaster: true,
              authorized: true,
              email_verified: true
            })
            .firestore(),
          "webmasters/person"
        ),
        {
          name: "Person"
        },
        { merge: true }
      )
    );
  });

  it("allow admins to read the webmasters collection", async () => {
    await assertSucceeds(
      getDoc(
        doc(
          testEnv
            .authenticatedContext("admin", {
              admin: true,
              webmaster: true,
              authorized: true,
              email_verified: true
            })
            .firestore(),
          "webmasters/person"
        )
      )
    );
  });

  it("prevent other users from editing the admin collection", async () => {
    await assertFails(
      setDoc(
        doc(
          testEnv
            .authenticatedContext("webmaster", {
              admin: false,
              webmaster: true,
              authorized: true,
              email_verified: true
            })
            .firestore(),
          "admin/person"
        ),
        {
          name: "Person"
        },
        { merge: true }
      )
    );
  });

  it("prevent other users from reading the admin collection", async () => {
    await assertFails(
      getDoc(
        doc(
          testEnv
            .authenticatedContext("webmaster", {
              admin: false,
              webmaster: true,
              authorized: true,
              email_verified: true
            })
            .firestore(),
          "admin/person"
        )
      )
    );
  });

  it("prevent other users from editing the webmasters collection", async () => {
    await assertFails(
      setDoc(
        doc(
          testEnv
            .authenticatedContext("webmaster", {
              admin: false,
              webmaster: true,
              authorized: true,
              email_verified: true
            })
            .firestore(),
          "webmasters/person"
        ),
        {
          name: "Person"
        },
        { merge: true }
      )
    );
  });

  it("prevent other users from reading the webmasters collection", async () => {
    await assertFails(
      getDoc(
        doc(
          testEnv
            .authenticatedContext("webmaster", {
              admin: false,
              webmaster: true,
              authorized: true,
              email_verified: true
            })
            .firestore(),
          "webmasters/person"
        )
      )
    );
  });

  it("allow anyone to get the site theme", async () => {
    await assertSucceeds(
      getDoc(
        doc(testEnv.unauthenticatedContext().firestore(), "configuration/theme")
      )
    );
  });

  it("allow admins to edit the site theme", async () => {
    await assertSucceeds(
      setDoc(
        doc(
          testEnv
            .authenticatedContext("admin", {
              admin: true,
              webmaster: true,
              authorized: true,
              email_verified: true
            })
            .firestore(),
          "configuration/theme"
        ),
        {
          light: {},
          dark: {}
        },
        { merge: true }
      )
    );
  });

  it("allow webmasters to edit the site theme", async () => {
    await assertSucceeds(
      setDoc(
        doc(
          testEnv
            .authenticatedContext("webmaster", {
              admin: false,
              webmaster: true,
              authorized: true,
              email_verified: true
            })
            .firestore(),
          "configuration/theme"
        ),
        {
          light: {},
          dark: {}
        },
        { merge: true }
      )
    );
  });

  it("prevent incorrect theme structures", async () => {
    await assertFails(
      setDoc(
        doc(
          testEnv
            .authenticatedContext("admin", {
              admin: true,
              webmaster: true,
              authorized: true,
              email_verified: true
            })
            .firestore(),
          "configuration/theme"
        ),
        {
          badData: ""
        },
        { merge: true }
      )
    );
  });

  it("prevent users from editing the site theme", async () => {
    await assertFails(
      setDoc(
        doc(
          testEnv
            .authenticatedContext("user", {
              admin: false,
              webmaster: false,
              authorized: true,
              email_verified: true
            })
            .firestore(),
          "configuration/theme"
        ),
        {
          light: {},
          dark: {}
        },
        { merge: true }
      )
    );
  });

  it("prevent unauthenticated users from editing the site theme", async () => {
    await assertFails(
      setDoc(
        doc(
          testEnv.unauthenticatedContext().firestore(),
          "configuration/theme"
        ),
        {
          light: {},
          dark: {}
        },
        { merge: true }
      )
    );
  });

  it("allow anyone to get the site settings", async () => {
    await assertSucceeds(
      getDoc(
        doc(
          testEnv.unauthenticatedContext().firestore(),
          "configuration/settings"
        )
      )
    );
  });

  it("allow authenticated users to get the private site settings", async () => {
    await assertSucceeds(
      getDoc(
        doc(
          testEnv
            .authenticatedContext("person", {
              authorized: true,
              email_verified: true
            })
            .firestore(),
          "configuration/priv-settings"
        )
      )
    );
  });

  it("prevent unauthenticated users from getting the private site settings", async () => {
    await assertFails(
      getDoc(
        doc(
          testEnv.unauthenticatedContext().firestore(),
          "configuration/priv-settings"
        )
      )
    );
  });

  it("allow admins to delete a settings document", async () => {
    await assertSucceeds(
      deleteDoc(
        doc(
          testEnv
            .authenticatedContext("admin", {
              admin: true,
              webmaster: true,
              authorized: true,
              email_verified: true
            })
            .firestore(),
          "configuration/settings"
        )
      )
    );
  });

  it("allow admins to create a settings document", async () => {
    await assertSucceeds(
      setDoc(
        doc(
          testEnv
            .authenticatedContext("admin", {
              admin: true,
              webmaster: true,
              authorized: true,
              email_verified: true
            })
            .firestore(),
          "configuration/settings"
        ),
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
    await assertSucceeds(
      deleteDoc(
        doc(
          testEnv
            .authenticatedContext("admin", {
              admin: true,
              webmaster: true,
              authorized: true,
              email_verified: true
            })
            .firestore(),
          "configuration/priv-settings"
        )
      )
    );
  });

  it("allow webmasters to edit a settings document", async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), "configuration/settings"), {});
    });
    await assertSucceeds(
      setDoc(
        doc(
          testEnv
            .authenticatedContext("webmaster", {
              admin: false,
              webmaster: true,
              authorized: true,
              email_verified: true
            })
            .firestore(),
          "configuration/settings"
        ),
        {
          calEdit: ""
        },
        { merge: true }
      )
    );
  });

  it("prevent incorrect settings document structures created by admins", async () => {
    await assertFails(
      setDoc(
        doc(
          testEnv
            .authenticatedContext("admin", {
              admin: true,
              webmaster: true,
              authorized: true,
              email_verified: true
            })
            .firestore(),
          "configuration/settings"
        ),
        {
          badData: ""
        }
      )
    );
  });

  it("prevent incorrect settings document structures created by webmasters", async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), "configuration/priv-settings"), {});
    });
    await assertFails(
      setDoc(
        doc(
          testEnv
            .authenticatedContext("webmaster", {
              admin: false,
              webmaster: true,
              authorized: true,
              email_verified: true
            })
            .firestore(),
          "configuration/settings"
        ),
        {
          badData: ""
        }
      )
    );
  });

  it("prevent users from editing a settings document", async () => {
    await assertFails(
      setDoc(
        doc(
          testEnv
            .authenticatedContext("user", {
              admin: false,
              webmaster: false,
              authorized: true,
              email_verified: true
            })
            .firestore(),
          "configuration/settings"
        ),
        {
          footerTxt: ""
        },
        { merge: true }
      )
    );
  });

  it("prevent unauthenticated users from editing a settings document", async () => {
    await assertFails(
      setDoc(
        doc(
          testEnv.unauthenticatedContext().firestore(),
          "configuration/settings"
        ),
        {
          footerTxt: ""
        },
        { merge: true }
      )
    );
  });

  it("allow admins to create a private settings document", async () => {
    await assertSucceeds(
      setDoc(
        doc(
          testEnv
            .authenticatedContext("admin", {
              admin: true,
              webmaster: true,
              authorized: true,
              email_verified: true
            })
            .firestore(),
          "configuration/priv-settings"
        ),
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
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), "configuration/priv-settings"), {});
    });
    await assertSucceeds(
      setDoc(
        doc(
          testEnv
            .authenticatedContext("webmaster", {
              admin: false,
              webmaster: true,
              authorized: true,
              email_verified: true
            })
            .firestore(),
          "configuration/priv-settings"
        ),
        {
          meetLink: ""
        },
        { merge: true }
      )
    );
  });

  it("prevent incorrect private settings document structures created by admins", async () => {
    await assertFails(
      setDoc(
        doc(
          testEnv
            .authenticatedContext("admin", {
              admin: true,
              webmaster: true,
              authorized: true,
              email_verified: true
            })
            .firestore(),
          "configuration/priv-settings"
        ),
        {
          badData: ""
        }
      )
    );
  });

  it("prevent incorrect private settings document structures created by webmasters", async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), "configuration/priv-settings"), {});
    });
    await assertFails(
      setDoc(
        doc(
          testEnv
            .authenticatedContext("webmaster", {
              admin: false,
              webmaster: true,
              authorized: true,
              email_verified: true
            })
            .firestore(),
          "configuration/priv-settings"
        ),
        {
          badData: ""
        }
      )
    );
  });

  it("prevent users from editing a private settings document", async () => {
    await assertFails(
      setDoc(
        doc(
          testEnv
            .authenticatedContext("user", {
              admin: false,
              webmaster: false,
              authorized: true,
              email_verified: true
            })
            .firestore(),
          "configuration/priv-settings"
        ),
        {
          meetLink: ""
        },
        { merge: true }
      )
    );
  });

  it("prevent unauthenticated users from editing a private settings document", async () => {
    await assertFails(
      setDoc(
        doc(
          testEnv.unauthenticatedContext().firestore(),
          "configuration/priv-settings"
        ),
        {
          meetLink: ""
        },
        { merge: true }
      )
    );
  });

  it("allow webmasters to view the documentation", async () => {
    await assertSucceeds(
      getDoc(
        doc(
          testEnv
            .authenticatedContext("webmaster", {
              admin: false,
              webmaster: true,
              authorized: true,
              email_verified: true
            })
            .firestore(),
          "configuration/documentation"
        )
      )
    );
  });

  it("allow admins to view the documentation", async () => {
    await assertSucceeds(
      getDoc(
        doc(
          testEnv
            .authenticatedContext("admin", {
              admin: true,
              webmaster: true,
              authorized: true,
              email_verified: true
            })
            .firestore(),
          "configuration/documentation"
        )
      )
    );
  });

  it("prevents users from viewing the documentation", async () => {
    await assertFails(
      getDoc(
        doc(
          testEnv
            .authenticatedContext("user", {
              admin: false,
              webmaster: false,
              authorized: true,
              email_verified: true
            })
            .firestore(),
          "configuration/documentation"
        )
      )
    );
  });

  it("prevents unauthenticated users from viewing the documentation", async () => {
    await assertFails(
      getDoc(
        doc(
          testEnv.unauthenticatedContext().firestore(),
          "configuration/documentation"
        )
      )
    );
  });

  it("prevents anyone from editing the documentation", async () => {
    await assertFails(
      setDoc(
        doc(
          testEnv
            .authenticatedContext("admin", {
              admin: true,
              webmaster: true,
              authorized: true,
              email_verified: true
            })
            .firestore(),
          "configuration/documentation"
        ),
        {}
      )
    );
  });

  it("allow admins to view the calendar editing password", async () => {
    await assertSucceeds(
      getDoc(
        doc(
          testEnv
            .authenticatedContext("admin", {
              admin: true,
              webmaster: true,
              authorized: true,
              email_verified: true
            })
            .firestore(),
          "configuration/apps-script-cal-edit"
        )
      )
    );
  });

  it("allow webmasters to view the calendar editing password", async () => {
    await assertSucceeds(
      getDoc(
        doc(
          testEnv
            .authenticatedContext("webmaster", {
              admin: false,
              webmaster: true,
              authorized: true,
              email_verified: true
            })
            .firestore(),
          "configuration/apps-script-cal-edit"
        )
      )
    );
  });

  it("prevent users from viewing the calendar editing password if the permissions are set to webmasters", async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), "configuration/settings"), {
        calEdit: "webmasters"
      });
    });
    await assertFails(
      getDoc(
        doc(
          testEnv
            .authenticatedContext("user", {
              admin: false,
              webmaster: false,
              authorized: true,
              email_verified: true
            })
            .firestore(),
          "configuration/apps-script-cal-edit"
        )
      )
    );
  });

  it("prevent unauthenticated users from viewing the calendar editing password if the permissions are set to webmasters", async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), "configuration/settings"), {
        calEdit: "webmasters"
      });
    });
    await assertFails(
      getDoc(
        doc(
          testEnv.unauthenticatedContext().firestore(),
          "configuration/apps-script-cal-edit"
        )
      )
    );
  });

  it("allow users to view the calendar editing password if the permissions are set to users", async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), "configuration/settings"), {
        calEdit: "users"
      });
    });
    await assertSucceeds(
      getDoc(
        doc(
          testEnv
            .authenticatedContext("user", {
              admin: false,
              webmaster: false,
              authorized: true,
              email_verified: true
            })
            .firestore(),
          "configuration/apps-script-cal-edit"
        )
      )
    );
  });

  it("prevent unauthenticated users from viewing the calendar editing password if the permissions are set to users", async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), "configuration/settings"), {
        calEdit: "users"
      });
    });
    await assertFails(
      getDoc(
        doc(
          testEnv.unauthenticatedContext().firestore(),
          "configuration/apps-script-cal-edit"
        )
      )
    );
  });

  it("allow users to view the calendar editing password if the permissions are set to public", async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), "configuration/settings"), {
        calEdit: "public"
      });
    });
    await assertSucceeds(
      getDoc(
        doc(
          testEnv
            .authenticatedContext("user", {
              admin: false,
              webmaster: false,
              authorized: true,
              email_verified: true
            })
            .firestore(),
          "configuration/apps-script-cal-edit"
        )
      )
    );
  });

  it("allow unauthenticated users to view the calendar editing password if the permissions are set to public", async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), "configuration/settings"), {
        calEdit: "public"
      });
    });
    await assertSucceeds(
      getDoc(
        doc(
          testEnv.unauthenticatedContext().firestore(),
          "configuration/apps-script-cal-edit"
        )
      )
    );
  });

  it("allow admins to view the calendar viewing password", async () => {
    await assertSucceeds(
      getDoc(
        doc(
          testEnv
            .authenticatedContext("admin", {
              admin: true,
              webmaster: true,
              authorized: true,
              email_verified: true
            })
            .firestore(),
          "configuration/apps-script-cal-view"
        )
      )
    );
  });

  it("allow webmasters to view the calendar viewing password", async () => {
    await assertSucceeds(
      getDoc(
        doc(
          testEnv
            .authenticatedContext("webmaster", {
              admin: false,
              webmaster: true,
              authorized: true,
              email_verified: true
            })
            .firestore(),
          "configuration/apps-script-cal-view"
        )
      )
    );
  });

  it("prevent users from viewing the calendar viewing password if the permissions are set to webmasters", async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), "configuration/settings"), {
        calView: "webmasters"
      });
    });
    await assertFails(
      getDoc(
        doc(
          testEnv
            .authenticatedContext("user", {
              admin: false,
              webmaster: false,
              authorized: true,
              email_verified: true
            })
            .firestore(),
          "configuration/apps-script-cal-view"
        )
      )
    );
  });

  it("prevent unauthenticated users from viewing the calendar viewing password if the permissions are set to webmasters", async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), "configuration/settings"), {
        calView: "webmasters"
      });
    });
    await assertFails(
      getDoc(
        doc(
          testEnv.unauthenticatedContext().firestore(),
          "configuration/apps-script-cal-view"
        )
      )
    );
  });

  it("allow users to view the calendar viewing password if the permissions are set to users", async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), "configuration/settings"), {
        calView: "users"
      });
    });
    await assertSucceeds(
      getDoc(
        doc(
          testEnv
            .authenticatedContext("user", {
              admin: false,
              webmaster: false,
              authorized: true,
              email_verified: true
            })
            .firestore(),
          "configuration/apps-script-cal-view"
        )
      )
    );
  });

  it("prevent unauthenticated users from viewing the calendar viewing password if the permissions are set to users", async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), "configuration/settings"), {
        calView: "users"
      });
    });
    await assertFails(
      getDoc(
        doc(
          testEnv.unauthenticatedContext().firestore(),
          "configuration/apps-script-cal-view"
        )
      )
    );
  });

  it("allow users to view the calendar viewing password if the permissions are set to public", async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), "configuration/settings"), {
        calView: "public"
      });
    });
    await assertSucceeds(
      getDoc(
        doc(
          testEnv
            .authenticatedContext("user", {
              admin: false,
              webmaster: false,
              authorized: true,
              email_verified: true
            })
            .firestore(),
          "configuration/apps-script-cal-view"
        )
      )
    );
  });

  it("allow unauthenticated users to view the calendar viewing password if the permissions are set to public", async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), "configuration/settings"), {
        calView: "public"
      });
    });
    await assertSucceeds(
      getDoc(
        doc(
          testEnv.unauthenticatedContext().firestore(),
          "configuration/apps-script-cal-view"
        )
      )
    );
  });

  it("allow admins to view the emailing password", async () => {
    await assertSucceeds(
      getDoc(
        doc(
          testEnv
            .authenticatedContext("admin", {
              admin: true,
              webmaster: true,
              authorized: true,
              email_verified: true
            })
            .firestore(),
          "configuration/apps-script-mail"
        )
      )
    );
  });

  it("allow webmasters to view the emailing password", async () => {
    await assertSucceeds(
      getDoc(
        doc(
          testEnv
            .authenticatedContext("webmaster", {
              admin: false,
              webmaster: true,
              authorized: true,
              email_verified: true
            })
            .firestore(),
          "configuration/apps-script-mail"
        )
      )
    );
  });

  it("prevent users from viewing the emailing password if the permissions are set to webmasters", async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), "configuration/settings"), {
        email: "webmasters"
      });
    });
    await assertFails(
      getDoc(
        doc(
          testEnv
            .authenticatedContext("user", {
              admin: false,
              webmaster: false,
              authorized: true,
              email_verified: true
            })
            .firestore(),
          "configuration/apps-script-mail"
        )
      )
    );
  });

  it("prevent unauthenticated users from viewing the emailing password if the permissions are set to webmasters", async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), "configuration/settings"), {
        email: "webmasters"
      });
    });
    await assertFails(
      getDoc(
        doc(
          testEnv.unauthenticatedContext().firestore(),
          "configuration/apps-script-mail"
        )
      )
    );
  });

  it("allow users to view the emailing password if the permissions are set to users", async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), "configuration/settings"), {
        email: "users"
      });
    });
    await assertSucceeds(
      getDoc(
        doc(
          testEnv
            .authenticatedContext("user", {
              admin: false,
              webmaster: false,
              authorized: true,
              email_verified: true
            })
            .firestore(),
          "configuration/apps-script-mail"
        )
      )
    );
  });

  it("prevent unauthenticated users from viewing the emailing password if the permissions are set to users", async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), "configuration/settings"), {
        email: "users"
      });
    });
    await assertFails(
      getDoc(
        doc(
          testEnv.unauthenticatedContext().firestore(),
          "configuration/apps-script-mail"
        )
      )
    );
  });

  it("allow users to view the emailing password if the permissions are set to public", async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), "configuration/settings"), {
        email: "public"
      });
    });
    await assertSucceeds(
      getDoc(
        doc(
          testEnv
            .authenticatedContext("user", {
              admin: false,
              webmaster: false,
              authorized: true,
              email_verified: true
            })
            .firestore(),
          "configuration/apps-script-mail"
        )
      )
    );
  });

  it("allow unauthenticated users to view the emailing password if the permissions are set to public", async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), "configuration/settings"), {
        email: "public"
      });
    });
    await assertSucceeds(
      getDoc(
        doc(
          testEnv.unauthenticatedContext().firestore(),
          "configuration/apps-script-mail"
        )
      )
    );
  });
});
