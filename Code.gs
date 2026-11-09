/**
 * Grace Baptist Church - Vehicle Sign-Out
 *
 * Back end for the vehicle sign-out page (index.html, hosted on GitHub
 * Pages). Drivers check a vehicle out (date, name, vehicle) and check it back
 * in with the post-trip inspection and any issues. Each trip is one row on the
 * Sign-Outs tab: checking out adds the row, and checking in fills in the rest.
 * Both are emailed to everyone on the Notify Emails tab.
 * See SETUP.md for how to deploy it.
 *
 * The vehicles are listed on the Vehicles tab: add or delete a row there and
 * the page shows the change the next time it opens. Drivers are kept on the
 * Drivers tab: new names are added there the first time someone uses the
 * page. To change the post-trip checklist or the list of common issues, edit
 * POST_TRIP or ISSUES below and deploy a new version.
 */

const SIGNOUTS_NAME = 'Sign-Outs';
const DRIVERS_NAME = 'Drivers';
const VEHICLES_NAME = 'Vehicles';
const EMAILS_NAME = 'Notify Emails';

// The Vehicles tab starts with these. After that, the tab is the list.
const STARTING_VEHICLES = ['Van 1', 'Van 2', 'Bus 3', 'Bus 25'];

// The post-trip inspection. Drivers tick every item before they can check in.
const POST_TRIP = [
  'Walked around the vehicle and looked for damage',
  'Checked for items left behind',
  'Took out the trash',
];

// Common problems drivers can tick at check-in. "Other" asks them to describe it.
const ISSUES = [
  'Warning or check engine light',
  'Tire low, worn or damaged',
  'Brakes (noise, soft pedal)',
  'Headlight, brake light or signal out',
  'Wipers or washer fluid',
  'Heat or A/C not working',
  'Fluid leak',
  'Windshield or mirror damage',
  'Body damage (dent, scratch)',
  'Seat or seat belt problem',
  'Door or wheelchair lift',
  'Needs fuel',
  'Needs cleaning inside',
  'Other',
];

// People emailed about every check-out and check-in, put on the Notify Emails tab by setup.
// Their addresses go in column A beside their names.
const NOTIFY_NAMES = ['Robert Tucker', 'Shawn Criswell'];

// One row per trip. Older sheets may also have a Pre-Trip Inspection column
// from before check-in/check-out; the script leaves it alone.
const HEADERS = ['Date', 'Driver', 'Vehicle', 'Status', 'Checked Out At', 'Checked In At',
  'Checked In By', 'Post-Trip Inspection', 'Issues', 'Issue Details', 'Emailed', 'Trip ID'];

// The Status column.
const OUT = 'Out';
const RETURNED = 'Returned';
// A vehicle checked out again before anyone checked it in: the old trip is closed with this.
const NEVER_IN = 'Not checked in';

// How the date and time columns show in the sheet.
const DATE_FORMAT = 'ddd m/d/yyyy';
const TIME_FORMAT = 'm/d/yyyy h:mm am/pm';

const BRAND_DEEP = '#233617';
const BRAND_MID = '#4E7A35';
const ISSUE_RED = '#B3261E';
// The logo travels inside each email (a PNG, 300px wide, written out as text) instead of
// being linked from the web. Mail apps often block linked pictures in mail from senders
// they can't verify; a picture inside the email shows either way.
const LOGO_PNG_BASE64 = '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';

const MAX_BAD_CODES = 20; // wrong driver codes allowed per 10 minutes, across all phones

/** GET: just says the script is running, to check a deployment in a browser. */
function doGet() {
  return json_({ app: 'Vehicle Sign-Out', status: 'ok' });
}

/**
 * POST from the page, body {action, code, form}. The page sends it as plain
 * text with no Google login attached, so it works whatever account a phone
 * uses. Every action needs the driver code, so a stranger who finds the page
 * can't read the driver list or send emails.
 */
function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents);
    if (!codeIsRight_(body.code)) return json_({ status: 'badcode' });
    if (body.action === 'load') return json_(pageConfig_());
    if (body.action === 'checkout') return json_(checkOut(body.form));
    if (body.action === 'checkin') return json_(checkIn(body.form));
    // A page that was open before the check-in/check-out update still sends this.
    if (body.action === 'submit') {
      throw new Error('This page has been updated. Close it, open it again, and check the vehicle out or in.');
    }
    throw new Error('Unknown request. Reload the page and try again.');
  } catch (err) {
    return json_({ status: 'error', message: err.message });
  }
}

function json_(value) {
  return ContentService.createTextOutput(JSON.stringify(value))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Run this once from the editor to create the tabs and grant permissions. It
 * also creates the driver code (the first time) and shows it in the Execution
 * log. To change the code, edit DRIVER_CODE under Project Settings > Script
 * Properties.
 */
function setup() {
  const sheet = signOutsTab_();
  vehiclesTab_();
  driversTab_();
  emailsTab_();
  SpreadsheetApp.getActiveSpreadsheet().setActiveSheet(sheet);

  const props = PropertiesService.getScriptProperties();
  let code = props.getProperty('DRIVER_CODE');
  if (!code) {
    code = String(Math.floor(100000 + Math.random() * 900000));
    props.setProperty('DRIVER_CODE', code);
  }
  Logger.log('Driver code: ' + code);
}

/**
 * Checks a code against the DRIVER_CODE Script Property, refusing everything
 * for 10 minutes after too many wrong ones. The code isn't in this file, so
 * the public copy on GitHub doesn't give it away.
 */
function codeIsRight_(code) {
  const expected = PropertiesService.getScriptProperties().getProperty('DRIVER_CODE');
  if (!expected) throw new Error('The code hasn\'t been set up yet. Run setup in Apps Script.');
  const cache = CacheService.getScriptCache();
  const misses = Number(cache.get('badDRIVER_CODE') || 0);
  if (misses >= MAX_BAD_CODES) throw new Error('Too many wrong codes. Wait 10 minutes and try again.');
  if (String(code || '').trim() === expected.trim()) return true;
  cache.put('badDRIVER_CODE', String(misses + 1), 600);
  return false;
}

/** Everything the page needs: the lists, and which vehicles are checked out right now. */
function pageConfig_() {
  return {
    status: 'ok',
    vehicles: vehicleNames_(),
    postTrip: POST_TRIP,
    issues: ISSUES,
    drivers: driverNames_(driversTab_()),
    out: openTrips_(),
  };
}

// ---- Check out and check in ---------------------------------------------------

/**
 * Check-out: adds a row marked Out and emails it. If the vehicle is still out
 * on an earlier trip that nobody checked in, that trip is closed as
 * "Not checked in" and the email says so.
 */
function checkOut(form) {
  form = form || {};
  const date = parseDate_(form.date);
  const outAt = parseTime_(date, form.time);
  const driver = driverName_(form.driver);
  if (!driver) throw new Error('Please enter your name.');
  const vehicle = String(form.vehicle || '');
  if (!vehicle) throw new Error('Please pick a vehicle.');
  // A page opened before a vehicle was removed from the tab may still show it.
  if (vehicleNames_().indexOf(vehicle) === -1) {
    throw new Error(vehicle + ' is no longer on the vehicle list. Close the page, open it again, and pick a vehicle.');
  }

  // Starts with a letter so the sheet never reads it as a number.
  const tripId = 'T' + Utilities.getUuid().replace(/-/g, '').slice(0, 11);
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  const closed = [];
  let sheet, cols, row, record;
  try {
    sheet = signOutsTab_();
    cols = headerIndex_(sheet);
    tripRows_(sheet, cols).forEach(function (t) {
      if (t.status === OUT && t.vehicle === vehicle) {
        sheet.getRange(t.row, cols['Status']).setValue(NEVER_IN);
        closed.push(t);
      }
    });
    record = {
      'Date': date,
      'Driver': addDriver_(driver),
      'Vehicle': vehicle,
      'Status': OUT,
      'Checked Out At': outAt,
      'Emailed': 'Check-out: Sending',
      'Trip ID': tripId,
    };
    const values = new Array(sheet.getLastColumn()).fill('');
    Object.keys(record).forEach(function (h) { values[cols[h] - 1] = record[h]; });
    sheet.appendRow(values);
    row = sheet.getLastRow();
    sheet.getRange(row, cols['Date']).setNumberFormat(DATE_FORMAT);
    sheet.getRange(row, cols['Checked Out At']).setNumberFormat(TIME_FORMAT);
  } finally {
    lock.releaseLock();
  }

  const sent = sendNotice_(checkOutEmail_(record, closed));
  sheet.getRange(row, cols['Emailed']).setValue('Check-out: ' + sent.status);
  return { status: 'saved', driver: record['Driver'], tripId: tripId, notified: sent.names, config: pageConfig_() };
}

/** Check-in: fills in the trip's row with the post-trip inspection and issues, then emails it. */
function checkIn(form) {
  form = form || {};
  let by = driverName_(form.driver);
  if (!by) throw new Error('Please enter your name.');
  const tripId = String(form.tripId || '');
  if (!tripId) throw new Error('Please pick the vehicle you\'re checking in.');
  if (form.postTripDone !== true) throw new Error('Please do the post-trip inspection and tick each item.');

  // A page with an older issue list may send one that's no longer in ISSUES.
  // Keep it rather than lose a reported problem.
  const issues = (Array.isArray(form.issues) ? form.issues : []).slice(0, 30)
    .map(function (s) { return clean_(s, 80); })
    .filter(function (s, i, all) { return s && all.indexOf(s) === i; });
  const details = clean_(form.details, 1000);
  if (issues.indexOf('Other') !== -1 && !details) throw new Error('Please describe the other issue.');

  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  let sheet, cols, row, record, emailedBefore;
  try {
    sheet = signOutsTab_();
    cols = headerIndex_(sheet);
    const trip = tripRows_(sheet, cols).filter(function (t) { return t.id === tripId; })[0];
    if (!trip) throw new Error('That trip isn\'t on the sheet anymore. Close the page and open it again.');
    if (trip.status === RETURNED) {
      throw new Error(trip.vehicle + ' was already checked in' + (trip.checkedInBy ? ' by ' + trip.checkedInBy : '') + '.');
    }
    if (trip.status !== OUT) {
      throw new Error(trip.vehicle + ' was checked out again since this trip. Close the page, open it again, and pick it from the list.');
    }
    by = addDriver_(by);
    row = trip.row;
    // The Emailed cell keeps the check-out result and adds the check-in one after it.
    emailedBefore = trip.emailed ? trip.emailed + '; ' : '';
    record = {
      'Date': trip.date,
      'Checked Out At': trip.checkedOutAt, // for the email; already on the sheet
      'Driver': trip.driver,
      'Vehicle': trip.vehicle,
      'Status': RETURNED,
      'Checked In At': new Date(),
      'Checked In By': by,
      'Post-Trip Inspection': 'Yes',
      'Issues': issues.join(', '),
      'Issue Details': details,
      'Emailed': emailedBefore + 'Check-in: Sending',
    };
    ['Status', 'Checked In At', 'Checked In By', 'Post-Trip Inspection', 'Issues', 'Issue Details', 'Emailed']
      .forEach(function (h) { sheet.getRange(row, cols[h]).setValue(record[h]); });
    sheet.getRange(row, cols['Checked In At']).setNumberFormat(TIME_FORMAT);
  } finally {
    lock.releaseLock();
  }

  const sent = sendNotice_(checkInEmail_(record, issues));
  sheet.getRange(row, cols['Emailed']).setValue(emailedBefore + 'Check-in: ' + sent.status);
  return { status: 'saved', driver: by, notified: sent.names, config: pageConfig_() };
}

/** Every trip row on the sheet: [{row, id, status, vehicle, driver, date, checkedOutAt, checkedInBy, emailed}]. */
function tripRows_(sheet, cols) {
  const last = sheet.getLastRow();
  if (last < 2) return [];
  const get = function (r, h) { return r[cols[h] - 1]; };
  return sheet.getRange(2, 1, last - 1, sheet.getLastColumn()).getValues().map(function (r, i) {
    return {
      row: i + 2,
      id: String(get(r, 'Trip ID')).trim(),
      status: String(get(r, 'Status')).trim(),
      vehicle: String(get(r, 'Vehicle')).trim(),
      driver: String(get(r, 'Driver')).trim(),
      date: get(r, 'Date'),
      checkedOutAt: get(r, 'Checked Out At'),
      checkedInBy: String(get(r, 'Checked In By')).trim(),
      emailed: String(get(r, 'Emailed')).trim(),
    };
  });
}

/** The trips still out, in Vehicles tab order: [{id, vehicle, driver, date: "2026-11-09"}]. */
function openTrips_() {
  const sheet = signOutsTab_();
  const cols = headerIndex_(sheet);
  const tz = SpreadsheetApp.getActiveSpreadsheet().getSpreadsheetTimeZone();
  const order = vehicleNames_();
  const rank = function (v) { const i = order.indexOf(v); return i === -1 ? order.length : i; };
  return tripRows_(sheet, cols)
    .filter(function (t) { return t.status === OUT && t.id; })
    .map(function (t) {
      return {
        id: t.id,
        vehicle: t.vehicle,
        driver: t.driver,
        date: t.date instanceof Date ? Utilities.formatDate(t.date, tz, 'yyyy-MM-dd') : '',
      };
    })
    .sort(function (a, b) { return rank(a.vehicle) - rank(b.vehicle) || (a.date < b.date ? -1 : 1); });
}

// ---- Email ------------------------------------------------------------------

/**
 * Sends one email ({subject, text, html}) to everyone on the Notify Emails
 * tab. Returns the text for the Emailed column and the names of the people it
 * went to.
 */
function sendNotice_(mail) {
  const people = recipients_();
  if (!people.length) return { status: 'Not sent: no addresses on ' + EMAILS_NAME, names: [] };
  try {
    MailApp.sendEmail({
      to: people.map(function (p) { return p.email; }).join(','),
      subject: mail.subject,
      body: mail.text,
      htmlBody: mail.html,
      inlineImages: { logo: Utilities.newBlob(Utilities.base64Decode(LOGO_PNG_BASE64), 'image/png', 'logo.png') },
      name: 'Grace Vehicle Sign-Out',
    });
  } catch (err) {
    console.error('Could not send the email: ' + err.message);
    return { status: 'Failed: ' + err.message, names: [] };
  }
  return {
    status: 'Sent ' + when_(new Date(), 'M/d h:mm a') + ' to ' + people.length,
    names: people.map(function (p) { return p.name || p.email; }),
  };
}

/** [{email, name}] from the Notify Emails tab: addresses in A, names in B. */
function recipients_() {
  const tab = emailsTab_();
  const last = tab.getLastRow();
  if (last < 2) return [];
  return tab.getRange(2, 1, last - 1, 2).getValues()
    .map(function (r) { return { email: String(r[0]).trim(), name: String(r[1]).trim() }; })
    .filter(function (p) { return p.email.indexOf('@') > 0; });
}

/** A date in the sheet's time zone, such as "Thu, Oct 29". */
function when_(date, format) {
  if (!(date instanceof Date)) return String(date || '');
  return Utilities.formatDate(date, SpreadsheetApp.getActiveSpreadsheet().getSpreadsheetTimeZone(), format);
}

function checkOutEmail_(record, closed) {
  const vehicle = record['Vehicle'];
  const tripDay = when_(record['Date'], 'EEE, MMM d');
  const outAt = when_(record['Checked Out At'], 'EEE, MMM d') + ' at ' + when_(record['Checked Out At'], 'h:mm a');
  // Earlier trips on this vehicle that nobody checked in.
  const notes = closed.map(function (t) {
    return vehicle + ' was still checked out to ' + t.driver + (t.date instanceof Date ? ' since ' +
      when_(t.date, 'EEE, MMM d') : '') + '. That trip was never checked in, so it was marked "' + NEVER_IN +
      '" on the sheet.';
  });

  const text = [vehicle + ' checked out by ' + record['Driver'], '', 'Checked out: ' + outAt];
  notes.forEach(function (n) { text.push('', 'Note: ' + n); });

  const block = notes.map(function (n) {
    return '<div style="margin-top:16px;padding:12px 16px;border-radius:10px;background:#FFF4E5;' +
      'border:1px solid #F5D3A3;color:#7A4100;">' + esc_(n) + '</div>';
  }).join('');
  return {
    subject: 'Vehicle Sign-Out Log: ' + vehicle + ' checked out, ' + record['Driver'] + ' (' + tripDay + ')',
    text: text.join('\n'),
    html: emailCard_('Vehicle Check-Out', vehicle, 'Checked out ' + outAt,
      emailRow_('Driver', record['Driver']), block),
  };
}

function checkInEmail_(record, issues) {
  const vehicle = record['Vehicle'];
  const inDay = when_(record['Checked In At'], 'EEE, MMM d');
  const inAt = inDay + ' at ' + when_(record['Checked In At'], 'h:mm a');
  const out = record['Checked Out At'];
  const outDay = out instanceof Date ? when_(out, 'EEE, MMM d') + ' at ' + when_(out, 'h:mm a')
    : when_(record['Date'], 'EEE, MMM d');
  // Who checked it in, when it wasn't the driver who checked it out.
  const by = record['Checked In By'];
  const other = by && by.toLowerCase() !== String(record['Driver']).toLowerCase() ? by : '';
  const details = record['Issue Details'];

  const text = [vehicle + ' checked in ' + inAt, '', 'Driver: ' + record['Driver'], 'Checked out: ' + outDay];
  if (other) text.push('Checked in by: ' + other);
  text.push('Post-trip inspection: Done', '', issues.length ? 'Issues reported:' : 'No issues reported.');
  issues.forEach(function (s) { text.push('  - ' + s); });
  if (details) text.push('', 'Details: ' + details);

  const detailsHtml = details ? '<p style="margin:10px 0 0;white-space:pre-wrap;">' + esc_(details) + '</p>' : '';
  let block;
  if (issues.length) {
    block = '<div style="margin-top:16px;padding:14px 16px;border-radius:10px;background:#FCE8E6;' +
      'border:1px solid #F4C7C3;"><div style="font-weight:700;color:' + ISSUE_RED + ';margin-bottom:6px;">' +
      'Issues or repairs needed</div><ul style="margin:0;padding-left:20px;">' +
      issues.map(function (s) { return '<li style="margin:2px 0;">' + esc_(s) + '</li>'; }).join('') + '</ul>' +
      detailsHtml + '</div>';
  } else {
    block = '<div style="margin-top:16px;padding:12px 16px;border-radius:10px;background:#EFF6EA;' +
      'border:1px solid #C6DBB6;color:' + BRAND_DEEP + ';font-weight:600;">No issues reported</div>' + detailsHtml;
  }
  return {
    subject: 'Vehicle Sign-Out Log: ' + (issues.length ? 'Repairs needed - ' : '') +
      vehicle + ' returned, ' + record['Driver'] + ' (' + inDay + ')',
    text: text.join('\n'),
    html: emailCard_('Vehicle Check-In', vehicle, 'Checked in ' + inAt,
      emailRow_('Driver', record['Driver']) + emailRow_('Checked out', outDay) +
      (other ? emailRow_('Checked in by', other) : '') + emailRow_('Post-trip inspection', 'Done'), block),
  };
}

/** One label/value line of an email's table. Both are plain text. */
function emailRow_(label, value) {
  return '<tr><td style="padding:8px 0;color:#5B6A50;width:150px;vertical-align:top;">' + esc_(label) + '</td>' +
    '<td style="padding:8px 0;font-weight:600;color:#1E2A16;">' + esc_(value) + '</td></tr>';
}

/** The email layout: logo bar, vehicle name, a line under it, a table of rows, then any extra block (HTML). */
function emailCard_(label, title, subtitle, rows, block) {
  return '<div style="background:#F3F8EF;padding:20px 12px;font-family:Arial,Helvetica,sans-serif;' +
    'font-size:15px;line-height:1.4;color:#1E2A16;">' +
    '<div style="max-width:520px;margin:0 auto;background:#ffffff;border:1px solid #DCE7D3;border-radius:14px;' +
    'overflow:hidden;">' +
    '<div style="background:' + BRAND_DEEP + ';padding:16px;text-align:center;">' +
    '<img src="cid:logo" alt="Grace Baptist Church" width="150" height="53" ' +
    'style="display:block;margin:0 auto;color:#ffffff;font-size:18px;font-weight:700;">' +
    '<div style="color:#CFE3C0;font-size:13px;letter-spacing:.06em;text-transform:uppercase;margin-top:6px;">' +
    esc_(label) + '</div></div>' +
    '<div style="padding:18px 20px 20px;">' +
    '<div style="font-size:24px;font-weight:700;color:' + BRAND_DEEP + ';">' + esc_(title) + '</div>' +
    '<div style="color:#5B6A50;margin-bottom:10px;">' + esc_(subtitle) + '</div>' +
    '<table style="width:100%;border-collapse:collapse;border-top:1px solid #DCE7D3;">' + rows + '</table>' +
    (block || '') +
    '</div></div>' +
    '<p style="text-align:center;color:#5B6A50;font-size:12px;margin:12px 0 0;">' +
    'Sent by the vehicle sign-out page.</p></div>';
}

function esc_(s) {
  return String(s).replace(/[&<>"']/g, function (c) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
  });
}

// ---- Drivers ----------------------------------------------------------------

function driverNames_(tab) {
  const last = tab.getLastRow();
  if (last < 2) return [];
  return tab.getRange(2, 1, last - 1, 1).getValues()
    .map(function (r) { return String(r[0]).trim(); })
    .filter(String);
}

/**
 * Returns the name as the Drivers tab spells it, adding it (and re-sorting
 * the list) if it's new. "john smith" matches "John Smith".
 */
function addDriver_(name) {
  const tab = driversTab_();
  const names = driverNames_(tab);
  const lower = name.toLowerCase();
  for (let i = 0; i < names.length; i++) {
    if (names[i].toLowerCase() === lower) return names[i];
  }
  tab.appendRow([name]);
  tab.getRange(2, 1, tab.getLastRow() - 1, 1).sort(1);
  return name;
}

/** Tidies a typed name: trims, single spaces, and capitals if typed all lowercase. */
function driverName_(value) {
  let s = clean_(value, 60).replace(/\s+/g, ' ');
  if (s && s === s.toLowerCase()) {
    s = s.replace(/(^|[\s'-])([a-z])/g, function (m, before, letter) { return before + letter.toUpperCase(); });
  }
  return s;
}

// ---- Tabs -------------------------------------------------------------------

/** Returns the Sign-Outs tab, creating it if needed. */
function signOutsTab_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SIGNOUTS_NAME);
  if (!sheet) {
    const sheets = ss.getSheets();
    // A brand-new spreadsheet has one empty "Sheet1": reuse it.
    if (sheets.length === 1 && sheets[0].getLastRow() === 0) {
      sheet = sheets[0].setName(SIGNOUTS_NAME);
    } else {
      sheet = ss.insertSheet(SIGNOUTS_NAME, 0);
    }
  }
  headerIndex_(sheet);
  return sheet;
}

/** Makes sure every header exists (adding missing ones on the right) and maps name -> column. */
function headerIndex_(sheet) {
  const lastCol = sheet.getLastColumn();
  const current = lastCol ? sheet.getRange(1, 1, 1, lastCol).getValues()[0].map(String) : [];

  // Sheets from before check-in/check-out called this column Submitted At.
  const old = current.indexOf('Submitted At');
  if (old !== -1 && current.indexOf('Checked Out At') === -1) {
    sheet.getRange(1, old + 1).setValue('Checked Out At');
    current[old] = 'Checked Out At';
  }

  const missing = HEADERS.filter(function (h) { return current.indexOf(h) === -1; });
  if (missing.length) {
    if (sheet.getMaxColumns() < current.length + missing.length) {
      sheet.insertColumnsAfter(sheet.getMaxColumns(), current.length + missing.length - sheet.getMaxColumns());
    }
    sheet.getRange(1, current.length + 1, 1, missing.length).setValues([missing]);
    current.push.apply(current, missing);
    formatSignOuts_(sheet, current);
  }

  const index = {};
  current.forEach(function (h, i) { if (h) index[h] = i + 1; });
  return index;
}

/**
 * Header colours and column formats. Rows that reported an issue are pink,
 * vehicles still out are yellow, and trips nobody checked in are orange.
 */
function formatSignOuts_(sheet, headers) {
  sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold').setFontColor('#ffffff')
    .setBackground(BRAND_DEEP).setWrap(true).setVerticalAlignment('middle');
  sheet.setFrozenRows(1);
  const rows = sheet.getMaxRows() - 1;
  const colNum = function (h) { return headers.indexOf(h) + 1; };
  const col = function (h) { return sheet.getRange(2, colNum(h), rows, 1); };
  col('Date').setNumberFormat(DATE_FORMAT);
  col('Checked Out At').setNumberFormat(TIME_FORMAT);
  col('Checked In At').setNumberFormat(TIME_FORMAT);
  col('Issue Details').setWrap(true);
  col('Trip ID').setFontColor('#8A9680');
  sheet.setColumnWidth(colNum('Driver'), 160);
  sheet.setColumnWidth(colNum('Checked In By'), 160);
  sheet.setColumnWidth(colNum('Issues'), 240);
  sheet.setColumnWidth(colNum('Issue Details'), 280);

  const all = sheet.getRange(2, 1, rows, headers.length);
  const rule = function (formula, color) {
    return SpreadsheetApp.newConditionalFormatRule().whenFormulaSatisfied(formula)
      .setBackground(color).setRanges([all]).build();
  };
  const issues = '$' + colLetter_(colNum('Issues')) + '2';
  const status = '$' + colLetter_(colNum('Status')) + '2';
  sheet.setConditionalFormatRules([
    rule('=' + issues + '<>""', '#FCE8E6'),
    rule('=' + status + '="' + OUT + '"', '#FFF4CC'),
    rule('=' + status + '="' + NEVER_IN + '"', '#FFE0B2'),
  ]);
}

/** 1 -> A, 27 -> AA. */
function colLetter_(n) {
  let s = '';
  while (n > 0) {
    s = String.fromCharCode(65 + (n - 1) % 26) + s;
    n = Math.floor((n - 1) / 26);
  }
  return s;
}

/** The Vehicles tab's names, top to bottom, skipping blanks and repeats. */
function vehicleNames_() {
  const tab = vehiclesTab_();
  const last = tab.getLastRow();
  if (last < 2) return [];
  return tab.getRange(2, 1, last - 1, 1).getValues()
    .map(function (r) { return String(r[0]).trim(); })
    .filter(function (v, i, all) { return v && all.indexOf(v) === i; });
}

function vehiclesTab_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let tab = ss.getSheetByName(VEHICLES_NAME);
  if (!tab) {
    tab = ss.insertSheet(VEHICLES_NAME);
    tab.getRange(1, 1, 1, 2).setValues([['Vehicle', 'The vehicles the page shows, in this order. ' +
      'Add a row for a new vehicle; delete a row to take one off the page. Past trips keep their vehicle.']]);
    tab.getRange(1, 1).setFontWeight('bold').setFontColor('#ffffff').setBackground(BRAND_DEEP);
    tab.getRange(1, 2).setFontColor('#5B6A50').setFontStyle('italic');
    tab.getRange(2, 1, STARTING_VEHICLES.length, 1).setValues(STARTING_VEHICLES.map(function (v) { return [v]; }));
    tab.setColumnWidth(1, 180);
    tab.setFrozenRows(1);
  }
  return tab;
}

function driversTab_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let tab = ss.getSheetByName(DRIVERS_NAME);
  if (!tab) {
    tab = ss.insertSheet(DRIVERS_NAME);
    tab.getRange(1, 1, 1, 2).setValues([['Driver', 'The names the page suggests. New drivers are ' +
      'added the first time they use the page. Fix a spelling or delete a row to change the list.']]);
    tab.getRange(1, 1).setFontWeight('bold').setFontColor('#ffffff').setBackground(BRAND_DEEP);
    tab.getRange(1, 2).setFontColor('#5B6A50').setFontStyle('italic');
    tab.setColumnWidth(1, 220);
    tab.setFrozenRows(1);
  }
  return tab;
}

function emailsTab_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let tab = ss.getSheetByName(EMAILS_NAME);
  if (!tab) {
    tab = ss.insertSheet(EMAILS_NAME);
    tab.getRange(1, 1, 1, 3).setValues([['Email', 'Name', 'Everyone here is emailed each time a ' +
      'vehicle is checked out or in. One address per row in column A; the name is optional. Clear the list to stop sending.']]);
    tab.getRange(1, 1, 1, 2).setFontWeight('bold').setFontColor('#ffffff').setBackground(BRAND_DEEP);
    tab.getRange(1, 3).setFontColor('#5B6A50').setFontStyle('italic');
    tab.getRange(2, 2, NOTIFY_NAMES.length, 1).setValues(NOTIFY_NAMES.map(function (n) { return [n]; }));
    tab.setColumnWidth(1, 280);
    tab.setColumnWidth(2, 160);
    tab.setFrozenRows(1);
  }
  return tab;
}

// ---- Values -----------------------------------------------------------------

/** "2026-10-29" -> Date at noon, so a time zone difference can't shift the day. */
function parseDate_(value) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(value || ''));
  if (!m) throw new Error('Please pick a date.');
  return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]), 12);
}

/**
 * The check-out time: the trip date at the "14:05" the driver set. A page
 * from before the time field was added sends none, so that uses now.
 */
function parseTime_(date, value) {
  if (value === undefined || value === null) return new Date();
  const m = /^(\d{1,2}):(\d{2})$/.exec(String(value));
  if (!m || Number(m[1]) > 23 || Number(m[2]) > 59) throw new Error('Please pick the time.');
  const at = new Date(date.getTime());
  at.setHours(Number(m[1]), Number(m[2]), 0, 0);
  return at;
}

/** Trims text and stops it from being read as a spreadsheet formula. */
function clean_(value, max) {
  let s = String(value === null || value === undefined ? '' : value).trim().slice(0, max);
  if (/^[=+\-@]/.test(s)) s = "'" + s;
  return s;
}
