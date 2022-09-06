const createEvent = (calendar, data) => {
  calendar.createEvent(data.title, new Date(data.start), new Date(data.end), {
    location: data.location,
    description: data.description,
    guests: data.guests,
    sendInvites: data.invite
  });
};

const createAllDayEvent = (calendar, data) => {
  if (data.end) {
    calendar.createAllDayEvent(
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
    calendar.createAllDayEvent(data.title, new Date(data.start), {
      location: data.location,
      description: data.description,
      guests: data.guests,
      sendInvites: data.invite
    });
  }
};

const deleteEvent = (calendar, data) => {
  const event = calendar.getEventById(data.event);
  event.deleteEvent();
};

const editEvent = (calendar, data) => {
  const event = calendar.getEventById(data.event);
  event.setTitle(data.title);
  if (data.allDay === true && data.end) {
    event.setAllDayDates(new Date(data.start), new Date(data.end));
  } else if (data.allDay === true) {
    event.setAllDayDate(new Date(data.start));
  } else {
    event.setTime(new Date(data.start), new Date(data.end));
  }
  event.setLocation(data.location);
  event.setDescription(data.description);
};

const getPassword = (method) => {
  const scriptProperties = PropertiesService.getScriptProperties();
  const email = scriptProperties.getProperty("firestore-email");
  const key = scriptProperties
    .getProperty("firestore-private-key")
    .replace(/\\n/g, "\n");
  const projectId = scriptProperties.getProperty("firestore-project-id");
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
    const calendarId = CalendarApp.getCalendarById(data.id);

    if (data.password !== dbPw) {
      return ContentService.createTextOutput(
        JSON.stringify({
          error: "Permission Denied!"
        })
      ).setMimeType(ContentService.MimeType.JSON);
    }
    switch (data.method) {
      case "createEvent": {
        createEvent(calendarId, data);
        break;
      }
      case "createAllDayEvent": {
        createAllDayEvent(calendarId, data);
        break;
      }
      case "deleteEvent": {
        deleteEvent(calendarId, data);
        break;
      }
      case "editEvent": {
        editEvent(calendarId, data);
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
    const id = e.parameter.id;
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
