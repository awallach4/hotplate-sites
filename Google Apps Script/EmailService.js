const sendMail = (data) => {
  const params = {
    to: data.to,
    subject: data.subject,
    htmlBody: data.body
  };

  if (data.sender) {
    params.name = data.sender;
  }

  if (data.reply) {
    params.replyTo = data.reply;
  }

  MailApp.sendEmail(params);
};

const getPassword = () => {
  const email = "YOUR_SERVICE_ACCOUNT_EMAIL";
  const key = "YOUR_PRIVATE_KEY";
  const projectId = "YOUR_PROJECT_ID";
  const firestore = FirestoreApp.getFirestore(email, key, projectId);
  const doc = firestore.getDocument("configuration/apps-script-mail");
  const dbPw = doc.obj.password;
  return dbPw;
};

const doPost = (e) => {
  try {
    const dbPw = getPassword();
    const data = JSON.parse(e.postData.contents);
    if (data.password !== dbPw) {
      return ContentService.createTextOutput(
        JSON.stringify({
          success: false,
          error: "Permission Denied!"
        })
      ).setMimeType(ContentService.MimeType.JSON);
    }
    sendMail(data);
    return ContentService.createTextOutput(
      JSON.stringify({
        success: true
      })
    ).setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(
      JSON.stringify({
        success: false,
        error: error
      })
    ).setMimeType(ContentService.MimeType.JSON);
  }
};
