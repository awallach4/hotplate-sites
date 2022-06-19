const calendarId = CalendarApp.getCalendarById("YOUR_CALENDAR_ID");

const createEvent = (data) => {
  calendarId.createEvent(data.title, new Date(data.start), new Date(data.end), {
    location: data.location,
    description: data.description,
    guests: data.guests,
    sendInvites: data.invite
  });
};

const createAllDayEvent = (data) => {
  if (data.end) {
    calendarId.createAllDayEvent(
      data.title,
      new Date(data.start),
      new Date(data.end),
      {
        location: data.location,
        description: data.description,
        guests: data.guests,
        sendInvites: data.invite
      }
    );
  } else {
    calendarId.createAllDayEvent(data.title, new Date(data.start), {
      location: data.location,
      description: data.description,
      guests: data.guests,
      sendInvites: data.invite
    });
  }
};

const deleteEvent = (event) => {
  const id = calendarId.getEventById(event);
  id.deleteEvent();
};

const editEvent = (data) => {
  const id = calendarId.getEventById(data.event);
  id.setTitle(data.title);
  if (data.allDay === true && data.end) {
    id.setAllDayDates(new Date(data.start), new Date(data.end));
  } else if (data.allDay === true) {
    id.setAllDayDate(new Date(data.start));
  } else {
    id.setTime(new Date(data.start), new Date(data.end));
  }
  id.setLocation(data.location);
  id.setDescription(data.description);
};

const getPassword = (method) => {
  const email = "YOUR_SERVICE_ACCOUNT_EMAIL";
  const key = "YOUR_PRIVATE_KEY";
  const projectId = "YOUR_PROJECT_ID";
  const firestore = FirestoreApp.getFirestore(email, key, projectId);
  let doc;
  if (method === "post") {
    doc = firestore.getDocument("configuration/apps-script-cal-edit");
  } else {
    doc = firestore.getDocument("configuration/apps-script-cal-view");
  }
  const dbPw = doc.obj.password;
  return dbPw;
};

const doPost = (e) => {
  try {
    const dbPw = getPassword("post");
    const data = JSON.parse(e.postData.contents);

    if (data.password !== dbPw) {
      return ContentService.createTextOutput(
        JSON.stringify({
          error: "Permission Denied!"
        })
      ).setMimeType(ContentService.MimeType.JSON);
    }
    switch (data.method) {
      case "createEvent": {
        createEvent(data);
        break;
      }
      case "createAllDayEvent": {
        createAllDayEvent(data);
        break;
      }
      case "deleteEvent": {
        deleteEvent(data.event);
        break;
      }
      case "editEvent": {
        editEvent(data);
        break;
      }
      default: {
        break;
      }
    }
    return ContentService.createTextOutput(
      JSON.stringify({
        success: true
      })
    ).setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(
      JSON.stringify({
        success: false,
        msg: error
      })
    ).setMimeType(ContentService.MimeType.JSON);
  }
};

const doGet = (e) => {
  try {
    const password = e.parameter.password;
    const dbPw = getPassword("get");
    if (password !== dbPw) {
      return ContentService.createTextOutput(
        JSON.stringify({
          error: "Permission Denied!"
        })
      ).setMimeType(ContentService.MimeType.JSON);
    }
    const id = "YOUR_CALENDAR_ID";
    const events = Calendar.Events.list(id);
    const holidays = Calendar.Events.list(
      "en.usa#holiday@group.v.calendar.google.com"
    );
    const calEvents = events.items.concat(holidays.items);
    return ContentService.createTextOutput(
      JSON.stringify(calEvents)
    ).setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(
      JSON.stringify({
        success: false,
        msg: error
      })
    ).setMimeType(ContentService.MimeType.JSON);
  }
};
